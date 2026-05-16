import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { sectionId, password } = await request.json();
    
    // セクションに応じた環境変数のマッピング
    const envMap: Record<string, string | undefined> = {
      textbook: process.env.PASS_TEXTBOOK,
      schoolbook: process.env.PASS_SCHOOLBOOK,
      shipping: process.env.PASS_SHIPPING,
      summary: process.env.PASS_SUMMARY,
      settings: process.env.PASS_SETTINGS,
    };

    const sectionPassword = envMap[sectionId];

    if (password && password === sectionPassword) {
      // セッションの有効期限を2時間に設定
      const twoHours = 2 * 60 * 60 * 1000;
      const expires = new Date(Date.now() + twoHours);

      const cookieStore = await cookies();
      cookieStore.set(`section_auth_${sectionId}`, 'authenticated', {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'パスワードが正しくありません' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
