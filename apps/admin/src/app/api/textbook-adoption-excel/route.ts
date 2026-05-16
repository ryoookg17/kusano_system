import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsStr = searchParams.get("ids");
    if (!idsStr) {
      return NextResponse.json({ error: "IDs are required" }, { status: 400 });
    }
    const ids = idsStr.split(",");

    // 1. テンプレートの読み込み
    const templatePath = path.join(process.cwd(), "public", "textbook_template.xlsx");
    if (!fs.existsSync(templatePath)) {
      throw new Error("Template file not found");
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    const sourceSheet = workbook.getWorksheet(1);
    if (!sourceSheet) throw new Error("Template sheet not found");
    sourceSheet.name = "TEMPLATE_HIDE";

    // 2. データの取得
    const { data: orders, error } = await supabase
      .from("textbook_orders")
      .select(`
        *,
        items:textbook_order_items(*)
      `)
      .in("id", ids);

    if (error) throw error;
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "Orders not found" }, { status: 404 });
    }

    const sortedOrders = ids.map(id => orders.find(o => o.id === id)).filter(Boolean);

    // 3. 全アイテムをフラットにまとめる
    const allItems: { item: any, order: any }[] = [];
    sortedOrders.forEach((order: any) => {
      const items = order.items || [];
      items.forEach((item: any) => {
        allItems.push({ item, order });
      });
    });

    // 4. 2件ずつチャンクに分けてシート作成
    for (let i = 0; i < allItems.length; i += 2) {
      const chunk = allItems.slice(i, i + 2);
      const sheetIndex = Math.floor(i / 2) + 1;
      const sheetName = `シート${sheetIndex}`;
      
      const currentSheet = workbook.addWorksheet(sheetName);

      const maxRow = sourceSheet.rowCount || 50;
      const maxCol = sourceSheet.columnCount || 15;

      for (let r = 1; r <= maxRow; r++) {
        const sourceRow = sourceSheet.getRow(r);
        const targetRow = currentSheet.getRow(r);
        targetRow.height = sourceRow.height;

        for (let c = 1; c <= maxCol; c++) {
          const sourceCell = sourceRow.getCell(c);
          const targetCell = targetRow.getCell(c);
          
          targetCell.value = sourceCell.value;
          targetCell.style = JSON.parse(JSON.stringify(sourceCell.style));
        }
      }

      for (let j = 1; j <= maxCol; j++) {
        currentSheet.getColumn(j).width = sourceSheet.getColumn(j).width;
      }

      const sourceMerges = (sourceSheet as any)._merges;
      if (sourceMerges) {
        Object.values(sourceMerges).forEach((m: any) => {
          currentSheet.mergeCells(m.model.top, m.model.left, m.model.bottom, m.model.right);
        });
      }

      currentSheet.pageSetup = { ...sourceSheet.pageSetup };

      const formatDate = (ds: string) => {
        if (!ds) return "";
        const d = new Date(ds);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      };

      chunk.forEach((data, index) => {
        const { item, order } = data;
        const offset = index * 20; // 2件目は20行下
        const orderDate = formatDate(order.created_at);
        
        // 帳合 (B2, J6) ※これは変更しない
        currentSheet.getCell(2 + offset, 2).value = item.accounting_vendor || "";
        currentSheet.getCell(6 + offset, 10).value = item.accounting_vendor || "";

        // 注文日 (F3 -> F2)
        currentSheet.getCell(2 + offset, 6).value = orderDate;
        
        // 基本情報
        currentSheet.getCell(6 + offset, 3).value = item.publisher || ""; // 7 -> 6
        currentSheet.getCell(7 + offset, 3).value = item.textbook_name || ""; // 8 -> 7
        currentSheet.getCell(10 + offset, 3).value = item.unit_price || ""; // 11 -> 10
        currentSheet.getCell(11 + offset, 3).value = order.school_name || ""; // 12 -> 11
        
        // 冊数・学年
        currentSheet.getCell(7 + offset, 10).value = (item.student_quantity || 0) + "冊"; // 8 -> 7
        currentSheet.getCell(8 + offset, 10).value = (item.teacher_quantity || 0) + "冊"; // 9 -> 8
        currentSheet.getCell(10 + offset, 10).value = item.target_grade || ""; // 11 -> 10
        
        // 本体・解答・形態
        // F10 -> F9: 本体がバラか冊子か
        currentSheet.getCell(9 + offset, 6).value = item.main_item_type || ""; 
        
        // J13 -> J12: 解答がなしか冊子かバラか
        currentSheet.getCell(12 + offset, 10).value = item.answer_type || "";
        
        // J12 -> J11: 解答をつけるかはずすか (J12が「なし」の場合は空欄)
        if (item.answer_type === "なし") {
          currentSheet.getCell(11 + offset, 10).value = "";
        } else {
          currentSheet.getCell(11 + offset, 10).value = item.answer_attached || "";
        }

        // J14 -> J13: 納品か販売か
        currentSheet.getCell(13 + offset, 10).value = item.delivery_method || "";

        // 請求先 (納品の場合のみ J15 -> J14 へ書き込み)
        if (item.delivery_method === "納品") {
          currentSheet.getCell(14 + offset, 10).value = item.billing_target || "";
        } else {
          currentSheet.getCell(14 + offset, 10).value = "";
        }
      });
    }

    workbook.removeWorksheet(sourceSheet.id);

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `採用注文書_${orders[0].school_name}_${dateStr}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="adoption_excel.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (err: any) {
    console.error("Adoption Excel API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
