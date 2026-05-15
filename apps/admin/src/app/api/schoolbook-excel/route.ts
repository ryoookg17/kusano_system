import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

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
      .from("schoolbook_orders")
      .select(`
        *,
        items:schoolbook_order_items(*)
      `)
      .order("created_at", { ascending: false });

    if (ids) {
      query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("学校図書注文");

    // ヘッダー行
    const headers = [
      "注文日時", "状態", "学校種別", "地区", "学校名", "ご担当者名", "学校TEL", "個人TEL", "備考",
      "通し番号", "書名", "著者名", "出版社", "ISBN", "本体価格", "税込価格", "冊数"
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
      };
    });
    headerRow.height = 28;

    // データ行
    (data || []).forEach((order: any) => {
      const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        : "";

      const commonCols = [
        dateStr,
        order.status,
        order.school_type,
        order.school_area,
        order.school_name,
        order.teacher_name,
        order.school_phone,
        order.personal_phone,
        order.remarks,
      ];

      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const row = sheet.addRow([
            ...commonCols,
            item.serial_number,
            item.book_title,
            item.author,
            item.publisher,
            item.isbn,
            item.price_excluding_tax,
            item.price_including_tax,
            item.quantity,
          ]);

          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
              top: { style: "thin" }, bottom: { style: "thin" },
              left: { style: "thin" }, right: { style: "thin" }
            };
            cell.alignment = { vertical: "middle", wrapText: true };
          });
        });
      } else {
        const row = sheet.addRow([...commonCols, "", "", "", "", "", "", "", ""]);
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
          };
        });
      }
    });

    // 列幅の自動調整
    const colWidths = [20, 8, 10, 10, 20, 14, 14, 14, 25, 8, 30, 16, 16, 16, 10, 10, 8];
    colWidths.forEach((width, i) => {
      sheet.getColumn(i + 1).width = width;
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `学校図書注文一覧_${dateTag}.xlsx`;
    
    // ユーザー指定のヘッダー設定を厳格に適用
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="schoolbook_excel.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (err: any) {
    console.error("Schoolbook Excel API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
