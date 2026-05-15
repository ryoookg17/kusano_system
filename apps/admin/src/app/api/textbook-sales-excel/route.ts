import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Supabase初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolName = searchParams.get('schoolName');
    const yearMonth = searchParams.get('yearMonth'); // "YYYY-MM"
    const subject = searchParams.get('subject') || "";
    const grade = searchParams.get('grade') || "";

    if (!schoolName || !yearMonth) {
      return new NextResponse("Bad Request: schoolName and yearMonth are required", { status: 400 });
    }

    // 対象の年月から月初の0時と月末の23:59:59を計算
    const startDate = new Date(`${yearMonth}-01T00:00:00+09:00`);
    const endYear = startDate.getFullYear();
    const endMonth = startDate.getMonth() + 1;
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59, 999);

    const { data: orders, error } = await supabase
      .from('textbook_orders')
      .select('*, items:textbook_order_items(*)')
      .eq('school_name', schoolName)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    let targetItems: any[] = [];
    orders?.forEach(order => {
      order.items?.forEach((item: any) => {
        // filter subject
        if (subject && item.subject !== subject) return;
        // filter grade
        if (grade && item.target_grade !== grade) return;
        
        targetItems.push({
          ...item,
          order_date: order.order_date || order.created_at,
          teacher_name: order.teacher_name
        });
      });
    });

    if (targetItems.length === 0) {
      return new NextResponse("指定された条件のデータが見つかりません。", { status: 404 });
    }

    const templatePath = path.join(process.cwd(), "public", "textbook_sales_template.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    // シート1を取得
    const sheet = workbook.getWorksheet(1);
    if (!sheet) throw new Error("Template sheet not found");

    // c5に学校名
    sheet.getCell('C5').value = schoolName;

    // A20に何年何月のご注文
    const [year, month] = yearMonth.split('-');
    sheet.getCell('A20').value = `${year}年${parseInt(month)}月のご注文`;

    // 22行目から下へループ
    let startRow = 22;
    targetItems.forEach((item, index) => {
      const rowNum = startRow + index;
      const row = sheet.getRow(rowNum);

      // A22に出版社
      row.getCell('A').value = item.publisher || "";
      // B22に書名
      row.getCell('B').value = item.textbook_name || "";
      // D22に学年
      row.getCell('D').value = item.target_grade || "";
      // E22に本体価格
      row.getCell('E').value = item.unit_price || 0;
      // F22に冊数 (生徒用のみ)
      row.getCell('F').value = item.student_quantity || 0;
      // G22に教科
      row.getCell('G').value = item.subject || "";
      // I22に担当の先生（名前に先生をつける）
      row.getCell('I').value = item.teacher_name ? `${item.teacher_name} 先生` : "";
      
      // K22に注文日
      const d = new Date(item.order_date);
      row.getCell('K').value = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
      
      row.commit();
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(`教材注文書_${schoolName}_${yearMonth}.xlsx`)}`);

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
