import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("textbook_orders")
      .select(`
        *,
        items:textbook_order_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "No data" }, { status: 404 });

    const headers = [
      "注文日時", "状態", "高校名", "ご担当者名", "学校TEL", "個人TEL",
      "教材名", "出版社", "本体価格", "対象学年", "生徒用数", "教員用数",
      "本体", "解答", "解答添付", "付属品", "付属品添付", "納品形態", "請求先", "希望日", "備考"
    ];

    const escapeCSV = (val: any) => {
      const str = val !== null && val !== undefined ? String(val) : "";
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows: string[][] = [];
    data.forEach((order: any) => {
      const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        : "";

      const commonCols = [
        escapeCSV(dateStr),
        escapeCSV(order.status),
        escapeCSV(order.school_name),
        escapeCSV(order.teacher_name),
        escapeCSV(order.school_phone),
        escapeCSV(order.personal_phone),
      ];

      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          rows.push([
            ...commonCols,
            escapeCSV(item.textbook_name),
            escapeCSV(item.publisher),
            escapeCSV(item.unit_price),
            escapeCSV(item.target_grade),
            escapeCSV(item.student_quantity),
            escapeCSV(item.teacher_quantity),
            escapeCSV(item.main_item_type),
            escapeCSV(item.answer_type),
            escapeCSV(item.answer_attached),
            escapeCSV(item.accessory_type),
            escapeCSV(item.accessory_attached),
            escapeCSV(item.delivery_method),
            escapeCSV(item.billing_target),
            escapeCSV(item.requested_date),
            escapeCSV(item.remarks),
          ]);
        });
      }
    });

    const csvLines = [
      headers.map(h => escapeCSV(h)).join(","),
      ...rows.map(r => r.join(","))
    ];
    const csvContent = csvLines.join("\n");

    // BOM付きUTF-8
    const bom = "\uFEFF";
    const body = bom + csvContent;

    const now = new Date();
    const dateTag = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
    const fileName = `補助教材注文_${dateTag}.csv`;

    const asciiFileName = `textbook_orders_${dateTag}.csv`;
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=UTF-8",
        "Content-Disposition": `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("CSV API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
