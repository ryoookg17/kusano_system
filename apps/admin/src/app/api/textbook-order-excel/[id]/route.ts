import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: order, error } = await supabase
      .from("textbook_orders")
      .select(`
        *,
        items:textbook_order_items(*)
      `)
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
    }

    // テンプレートファイルの読み込み
    const templatePath = path.join(process.cwd(), "public", "textbook_template.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const items = order.items || [];
    const chunks: any[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      chunks.push(items.slice(i, i + 2));
    }

    const sourceSheet = workbook.getWorksheet(1);
    if (!sourceSheet) throw new Error("テンプレートシートが見つかりません");

    const formatDate = (ds: string) => {
      if (!ds) return "";
      const d = new Date(ds);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    };

    const orderDate = formatDate(order.created_at);

    chunks.forEach((chunk, index) => {
      let currentSheet: any;
      if (index === 0) {
        currentSheet = sourceSheet;
        currentSheet.name = `注文書 ${index + 1}`;
      } else {
        currentSheet = workbook.addWorksheet(`注文書 ${index + 1}`);
        sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          const newRow = currentSheet.getRow(rowNumber);
          newRow.height = row.height;
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const newCell = newRow.getCell(colNumber);
            newCell.value = cell.value;
            newCell.style = { ...cell.style };
          });
        });
        for (let i = 1; i <= sourceSheet.columns.length; i++) {
          currentSheet.getColumn(i).width = sourceSheet.getColumn(i).width;
        }
        const sourceMerges = (sourceSheet as any)._merges;
        if (sourceMerges) {
          Object.values(sourceMerges).forEach((m: any) => {
            currentSheet.mergeCells(m.model.top, m.model.left, m.model.bottom, m.model.right);
          });
        }
        currentSheet.pageSetup = { ...sourceSheet.pageSetup };
      }

      [0, 1].forEach((i) => {
        const item = chunk[i];
        if (!item) return;
        const offset = i * 21;
        currentSheet.getCell(3 + offset, 6).value = orderDate;
        currentSheet.getCell(9 + offset, 6).value = item.main_item_type || "";
        currentSheet.getCell(7 + offset, 3).value = item.publisher || "";
        currentSheet.getCell(8 + offset, 3).value = item.textbook_name || "";
        currentSheet.getCell(11 + offset, 3).value = item.unit_price || "";
        currentSheet.getCell(12 + offset, 3).value = order.school_name || "";
        currentSheet.getCell(8 + offset, 10).value = (item.student_quantity || 0) + "冊";
        currentSheet.getCell(9 + offset, 10).value = (item.teacher_quantity || 0) + "冊";
        currentSheet.getCell(11 + offset, 10).value = item.target_grade || "";
        currentSheet.getCell(15 + offset, 10).value = item.billing_target || "";
        currentSheet.getCell(15 + offset, 11).value = ""; // 隣のK列(学校)のラベルを消去

        currentSheet.getCell(12 + offset, 11).value = item.answer_attached || "";
        currentSheet.getCell(13 + offset, 11).value = item.answer_type || "";
        currentSheet.getCell(14 + offset, 11).value = item.delivery_method || "";
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `採用注文書_${order.school_name}_${dateStr}.xlsx`;
    const encodedFileName = encodeURIComponent(fileName).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="order_excel.xlsx"; filename*=UTF-8''${encodedFileName}`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Order Excel API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
