import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    // 環境変数が設定されていない場合のチェック
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration is missing in environment variables.');
      return NextResponse.json(
        { success: false, error: 'SMTP configuration is missing' },
        { status: 500 }
      );
    }

    // データベースから管理者通知用メールアドレスを取得（存在しなくてもエラーにしない）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: emailKey } = await supabase
      .from('access_keys')
      .select('access_code')
      .eq('key_type', 'admin_notification_email')
      .maybeSingle();

    // 1. 宛先(to)が空の場合は管理者宛にする（通知専用モード）
    // 2. BCCに管理者を設定
    const adminEmail = emailKey?.access_code || process.env.SMTP_BCC_EMAIL || process.env.SMTP_USER;
    const finalTo = to || adminEmail;
    const adminBcc = adminEmail !== finalTo ? adminEmail : undefined;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'くさの書店'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: finalTo,
      bcc: adminBcc,
      subject: subject,
      text: text,
      html: html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
