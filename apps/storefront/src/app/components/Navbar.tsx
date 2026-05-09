"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="site-nav">
      {/* ハンバーガーボタン（モバイルでのみ表示） */}
      <button 
        className="menu-toggle" 
        onClick={toggleMenu}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* メニューリスト */}
      <ul className={isOpen ? "nav-links open" : "nav-links"}>
        <li><Link href="/" onClick={closeMenu}>ホーム</Link></li>
        <li><Link href="/announcements" onClick={closeMenu}>お知らせ</Link></li>
        <li><Link href="/stores" onClick={closeMenu}>店舗情報</Link></li>
        <li><Link href="/history" onClick={closeMenu}>沿革</Link></li>
        <li><Link href="/school_menu" onClick={closeMenu}>学校関係</Link></li>
      </ul>
    </nav>
  );
}
