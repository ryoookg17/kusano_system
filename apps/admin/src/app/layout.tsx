import type { Metadata } from "next";
import Link from 'next/link';
import { Home, BookOpen, Library, Truck, Bell, Settings, FileText, Database } from 'lucide-react';
import "./globals.css";

export const metadata: Metadata = {
  title: "くさの書店｜データ管理",
  description: "くさの書店 注文管理・データ管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body style={{ display: "flex", flexDirection: "column", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Noto Sans JP', sans-serif" }}>
        
        {/* トップヘッダー */}
        <header style={{ width: "100%", backgroundColor: "#1e293b", color: "#f8fafc", padding: "10px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", zIndex: 100, position: "sticky", top: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: 0, color: "white" }}>
              くさの書店｜データ管理
            </h1>
          </div>

          <nav style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", flex: 1, marginLeft: "20px" }}>
            <Link href="/textbook" className="header-link" title="補助教材 管理">
              <BookOpen size={18} />
              <span style={{ fontWeight: "500" }}>補助教材管理</span>
            </Link>

            <Link href="/schoolbook" className="header-link" title="学校図書 管理">
              <Library size={18} />
              <span style={{ fontWeight: "500" }}>学校図書管理</span>
            </Link>

            <Link href="/shipping" className="header-link" title="郵送依頼 管理">
              <Truck size={18} />
              <span style={{ fontWeight: "500" }}>郵送管理</span>
            </Link>

            <Link href="/school-summary" className="header-link" title="学校別まとめ">
              <Home size={18} />
              <span style={{ fontWeight: "500" }}>学校別管理</span>
            </Link>

            <Link href="/announcements" className="header-link" title="お知らせ 管理">
              <Bell size={18} />
              <span style={{ fontWeight: "500" }}>お知らせ管理</span>
            </Link>

            <Link href="/settings" className="header-link" title="合言葉・設定">
              <Settings size={18} />
              <span style={{ fontWeight: "500" }}>設定管理</span>
            </Link>
          </nav>
        </header>

        {/* メインコンテンツエリア */}
        <main style={{ flex: 1, padding: "30px 40px", overflowY: "auto", width: "100%", maxWidth: "1600px", margin: "0 auto" }}>
          {children}
        </main>

      </body>
    </html>
  );
}
