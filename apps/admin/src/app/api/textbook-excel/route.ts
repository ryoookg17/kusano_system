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
    let sheet: ExcelJS.Worksheet;

    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      sheet = workbook.getWorksheet(1) || workbook.addWorksheet("Sheet1");
    } else {
      sheet = workbook.addWorksheet("Sheet1");
      // テンプレートがない場合のヘッダー作成
      sheet.getRow(1).values = [
        "注文日", "学校名", "担当先生", "学校TEL", "個人TEL", 
        "帳合", "出版社", "教材名", "生徒冊数", "教員冊数", 
        "本体価格", "税込価格", "合計金額", "学年", "教科"
      ];
    }

    sheet.name = "全体";

    // 既存のデータ行（2行目以降）をクリアして上書きする準備
    // (テンプレートにサンプル行がある場合を考慮)
    let currentRow = 2;

    (data || []).forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          // 注文日の整形 (YYYY/MM/DD)
          const dateStr = order.created_at
            ? new Date(order.created_at).toLocaleDateString("ja-JP", { year: 'numeric', month: '2-digit', day: '2-digit' })
            : "";

          // Aから順に: 注文日, 学校名, 担当先生, 学校TEL, 個人TEL, 帳合, 出版社, 教材名, 生徒用数, 教員用数, 本体価格, 税込価格, 合計金額, 学年, 教科
          const rowData = [
            dateStr,                  // A (1)
            order.school_name,        // B (2)
            order.teacher_name,       // C (3)
            order.school_phone,       // D (4)
            order.personal_phone,     // E (5)
            item.accounting_vendor,   // F (6)
            item.publisher,           // G (7)
            item.textbook_name,       // H (8)
            item.student_quantity,    // I (9)
            item.teacher_quantity,    // J (10)
            item.unit_price,          // K (11)
            null,                     // L (12) 税込価格 (公式)
            null,                     // M (13) 合計金額 (公式)
            item.target_grade,        // N (14)
            item.subject,             // O (15)
            item.main_item_type,      // P (16) 本体
            item.answer_type,         // Q (17) 解答形態
            item.answer_attached,     // R (18) 解答添付
            item.accessory_type,      // S (19) 付属品形態
            item.accessory_attached,  // T (20) 付属品添付
            item.delivery_method,     // U (21) 納品形態
            item.billing_target,      // V (22) 請求先
            item.requested_date,      // W (23) 販売希望日
            item.remarks              // X (24) 備考
          ];

          const row = sheet.getRow(currentRow);
          row.values = rowData;

          // 計算式の適用 (K: 本体, L: 税込, M: 合計, I: 生徒数)
          row.getCell(12).value = { formula: `K${currentRow}*1.1` }; 
          row.getCell(13).value = { formula: `L${currentRow}*I${currentRow}` };

          // スタイル適用
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
              top: { style: "thin" }, bottom: { style: "thin" },
              left: { style: "thin" }, right: { style: "thin" }
            };
            cell.alignment = { vertical: "middle", wrapText: true };
          });

          currentRow++;
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `補助教材注文一覧_${dateTag}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="textbook_summary.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (err: any) {
    console.error("Textbook Excel API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
