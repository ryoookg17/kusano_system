import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
        const offset = index * 21;
        const orderDate = formatDate(order.created_at);
        
        currentSheet.getCell(3 + offset, 6).value = orderDate;
        currentSheet.getCell(7 + offset, 3).value = item.publisher || "";
        currentSheet.getCell(8 + offset, 3).value = item.textbook_name || "";
        currentSheet.getCell(10 + offset, 6).value = item.main_item_type || "";
        currentSheet.getCell(11 + offset, 3).value = item.unit_price || "";
        currentSheet.getCell(12 + offset, 3).value = order.school_name || "";
        currentSheet.getCell(8 + offset, 10).value = (item.student_quantity || 0) + "冊";
        currentSheet.getCell(9 + offset, 10).value = (item.teacher_quantity || 0) + "冊";
        currentSheet.getCell(11 + offset, 10).value = item.target_grade || "";
        
        currentSheet.getCell(12 + offset, 10).value = item.answer_attached || "";
        currentSheet.getCell(13 + offset, 10).value = item.answer_type || "";

        // J14 / J35 (形態) と J15 / J36 (請求先) を最後に書き込んで上書きを防止
        currentSheet.getCell(14 + offset, 10).value = item.delivery_method || "";
        if (item.delivery_method === "納品") {
          currentSheet.getCell(15 + offset, 10).value = item.billing_target || "";
        } else {
          currentSheet.getCell(15 + offset, 10).value = "";
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
