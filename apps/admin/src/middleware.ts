import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証をスキップするパス
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') || // 静的ファイル (favicon.ico, images, etc.)
    pathname.startsWith('/_next') // Next.js の内部パス
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('admin_session');

  if (!session || session.value !== 'authenticated') {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> ただし /api/auth は上記で明示的にスキップ
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
