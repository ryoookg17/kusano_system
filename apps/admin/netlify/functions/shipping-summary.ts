import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. 過去24時間以内の依頼を取得
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: requests, error: fetchError } = await supabase
      .from('shipping_requests')
      .select('school_name, student_name')
      .gte('created_at', last24h);

    if (fetchError) throw fetchError;

    // 2. 依頼がない場合は終了
    if (!requests || requests.length === 0) {
      console.log('No shipping requests in the last 24 hours.');
      return new Response("No requests to process", { status: 200 });
    }

    // 3. 学校ごとに集計
    const summaryMap: Record<string, number> = {};
    requests.forEach(req => {
      summaryMap[req.school_name] = (summaryMap[req.school_name] || 0) + 1;
    });

    // 4. 管理者メールアドレスの取得
    const { data: emailKey } = await supabase
      .from('access_keys')
      .select('access_code')
      .eq('key_type', 'admin_notification_email')
      .maybeSingle();

    const adminEmail = emailKey?.access_code || process.env.SMTP_USER;
    if (!adminEmail) throw new Error('Admin email not configured');

    // 5. メール本文の作成
    const summaryText = Object.entries(summaryMap)
      .map(([school, count]) => `・${school}: ${count}件`)
      .join('\n');

    const totalCount = requests.length;
    const subject = `【日次レポート】郵送依頼集計 (${totalCount}件)`;
    const text = `
昨日、HPより以下の郵送依頼がありました。

■学校別集計
${summaryText}

合計: ${totalCount}件

詳細は管理画面をご確認ください。
https://kusano-admin.netlify.app/shipping
`;

    // 6. メール送信
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'くさの書店'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: subject,
      text: text,
    });

    console.log(`Summary sent for ${totalCount} requests.`);
    return new Response("Summary sent successfully", { status: 200 });
  } catch (error: any) {
    console.error('Scheduled function error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};

// 毎日午前0時（UTC）＝午前9時（JST）に実行
export const config: Config = {
  schedule: "0 0 * * *"
};
