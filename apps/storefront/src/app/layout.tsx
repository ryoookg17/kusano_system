import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif",
  weight: ["400", "700"],
  subsets: ["latin"],
});

import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "長崎市の本屋 | くさの書店",
  description: "長崎県長崎市にある「くさの書店」の公式サイトです。参考書や教材のご注文はこちらから。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${notoSerifJP.variable}`}
        style={{ fontFamily: "var(--font-noto-sans), sans-serif" }}
      >
        <header className="site-header">
          <div className="site-header-inner">
            <h1 className="site-title" style={{ fontFamily: "var(--font-noto-serif), serif" }}>
              <a href="/">くさの書店</a>
            </h1>
            <Navbar />
          </div>
        </header>

        <main className="main-container animate-fade-in">
          {children}
        </main>

        <footer className="site-footer">
          <p>&copy; {new Date().getFullYear()} くさの書店</p>
        </footer>
      </body>
    </html>
  );
}
