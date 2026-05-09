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
    const ids = idsStr ? idsStr.split(",") : null;

    let query = supabase
      .from("textbook_orders")
      .select(`
        *,
        items:textbook_order_items(*)
      `)
      .order("created_at", { ascending: false });

    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { data, error } = await query;
    if (error) throw error;

    // テンプレートの読み込み
    const templatePath = path.join(process.cwd(), "public", "textbook_summary_template.xlsx");
    const workbook = new ExcelJS.Workbook();
    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
    } else {
      workbook.addWorksheet("Sheet1");
    }

    // 学校ごとにグループ化
    const ordersBySchool: { [key: string]: any[] } = {};
    (data || []).forEach(order => {
      const school = order.school_name || "その他";
      if (!ordersBySchool[school]) ordersBySchool[school] = [];
      ordersBySchool[school].push(order);
    });

    const sourceSheet = workbook.getWorksheet(1);
    if (!sourceSheet) throw new Error("Template sheet not found");

    // 行追加と計算式適用の共通関数
    const addDataRow = (sheet: any, order: any, item: any) => {
      const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        : "";

      const rowData = [
        dateStr,
        item.subject || "",
        order.school_name,
        order.teacher_name,
        order.email,
        order.school_phone,
        order.personal_phone,
        item.textbook_name,
        item.publisher,
        item.unit_price,
        null, // 税込価格 (11: K)
        null, // 合計金額 (12: L)
        item.target_grade,
        item.student_quantity,
        item.teacher_quantity,
        null, // 合計冊数 (16: P)
        item.main_item_type,
        item.answer_type,
        item.answer_attached,
        item.accessory_type,
        item.accessory_attached,
        item.delivery_method,
        item.billing_target,
        item.requested_date,
        item.remarks
      ];

      const row = sheet.addRow(rowData);
      const r = row.number;
      row.getCell(11).value = { formula: `J${r}*1.1` };
      row.getCell(16).value = { formula: `N${r}+O${r}` };
      row.getCell(12).value = { formula: `K${r}*P${r}` };

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    };

    // 列幅の定義 (1:日時, 2:教科, 3:学校, 4:先生, 5:メール, 6:学校TEL, 7:個人TEL, 8:教材, 9:出版社, 10:単価, 11:税込, 12:合計金, 13:学年, 14:生徒, 15:教員, 16:合計冊, 17:本体, 18:解答, 19:解添, 20:付録, 21:付添, 22:納品, 23:請求, 24:希望日, 25:備考)
    const colWidths = [20, 12, 20, 15, 25, 15, 15, 30, 18, 10, 10, 12, 12, 10, 10, 12, 10, 10, 10, 10, 10, 12, 12, 18, 30];

    // 1. 「全体」シートの作成
    sourceSheet.name = "全体";
    // テンプレートの2行目（計算式用）を削除して2行目から詰め込む
    if (sourceSheet.rowCount >= 2) {
      sourceSheet.spliceRows(2, sourceSheet.rowCount - 1);
    }

    (data || []).forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => addDataRow(sourceSheet, order, item));
      }
    });
    // 幅調整
    colWidths.forEach((width, i) => {
      sourceSheet.getColumn(i + 1).width = width;
    });

    // 2. 学校別シートの作成
    Object.entries(ordersBySchool).forEach(([schoolName, schoolOrders]) => {
      const sheetName = schoolName.substring(0, 31);
      const sheet = workbook.addWorksheet(sheetName);

      // ヘッダーのコピー
      const sourceRow = sourceSheet.getRow(1);
      const targetRow = sheet.getRow(1);
      sourceRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const targetCell = targetRow.getCell(colNumber);
        targetCell.value = cell.value;
        targetCell.style = cell.style;
      });
      sheet.getRow(1).height = sourceRow.height;

      // データの流し込み
      schoolOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => addDataRow(sheet, order, item));
        }
      });
      // 幅調整
      colWidths.forEach((width, i) => {
        sheet.getColumn(i + 1).width = width;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `補助教材注文一覧_${dateTag}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="textbook_excel.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (err: any) {
    console.error("Textbook Excel API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
