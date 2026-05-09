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
      .from("shipping_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (ids) {
      query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("郵送依頼");

    // ヘッダー行
    const headers = ["依頼日時", "学校名", "学年", "学科・コース", "氏名", "メールアドレス", "電話番号", "郵便番号", "住所", "備考", "ステータス"];

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
    (data || []).forEach((req: any) => {
      const dateStr = req.created_at
        ? new Date(req.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        : "";

      const row = sheet.addRow([
        dateStr,
        req.school_name,
        req.grade,
        req.course,
        req.student_name,
        req.email,
        req.phone,
        req.zipcode,
        req.address,
        req.remarks,
        req.status
      ]);

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    // 列幅の自動調整
    const colWidths = [20, 20, 10, 15, 15, 25, 15, 12, 40, 30, 12];
    colWidths.forEach((width, i) => {
      sheet.getColumn(i + 1).width = width;
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `郵送依頼一覧_${dateTag}.xlsx`;
    
    // ユーザー指定 pillのヘッダー設定を厳格に適用
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="shipping_excel.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (err: any) {
    console.error("Shipping Excel API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
