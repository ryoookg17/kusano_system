"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  created_at: string;
}

export default function Home() {
  const [recentNews, setRecentNews] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentNews() {
      // 1週間前の日付を計算
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, created_at")
        .eq("is_published", true)
        .gte("created_at", oneWeekAgo.toISOString()) // 更新または作成が1週間以内
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setRecentNews(data || []);
      }
      setLoading(false);
    }
    fetchRecentNews();
  }, []);

  return (
    <div className="home-container">
      {/* ヒーローセクション */}
      <section style={{ marginBottom: "4rem", textAlign: "center" }}>
        <div style={{ position: "relative", maxWidth: "1000px", margin: "0 auto", overflow: "hidden", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
          <img 
            src="/kusano_green.jpg" 
            alt="くさの書店 メインビジュアル" 
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      </section>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>
        {/* 新着情報セクション */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 className="section-heading">新着情報</h2>
          <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "16px", textAlign: "left", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
            {loading ? (
              <p className="text-gray-500">読み込み中...</p>
            ) : recentNews.length === 0 ? (
              <p className="text-gray-500" style={{ textAlign: "center", padding: "20px" }}>現在、新しいお知らせはありません。</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentNews.map((news) => (
                  <li key={news.id} style={{ borderBottom: "1px solid #f1f5f9", padding: "15px 5px" }}>
                    <Link 
                      href={`/announcements#id-${news.id}`}
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        color: "var(--kusano-theme)",
                        fontWeight: "700",
                        textDecoration: "none"
                      }}
                    >
                      <span>{news.title}</span>
                      <ChevronRight size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <Link href="/announcements" style={{ fontSize: "0.95rem", color: "#666", fontWeight: "bold", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                すべてのお知らせを見る <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* 店舗情報セクション */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 className="section-heading">店舗のご案内</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", alignItems: "start" }}>
            <div style={{ textAlign: "left", padding: "30px", backgroundColor: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1.4rem", color: "var(--kusano-theme)", marginBottom: "15px", fontWeight: "bold" }}>くさの書店 住吉店</h3>
              <p style={{ lineHeight: "2", fontSize: "1.05rem", color: "#334155", margin: 0 }}>
                〒852-8155 長崎県長崎市中園町6-19<br />
                <strong>電話:</strong> <a href="tel:095-847-5782" style={{ color: "var(--kusano-theme)", fontWeight: "bold" }}>095-847-5782</a><br />
                <strong>営業時間:</strong> 10:00〜20:00<br />
                <strong>アクセス:</strong> 住吉電停より徒歩1分
              </p>
            </div>
            
            <div style={{ overflow: "hidden", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", border: "1px solid #ddd", height: "350px" }}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3350.366479007548!2d129.86064931522237!3d32.78859998096898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35155364808c7739%3A0x6d9e03d6d0c6e0!2z44GP44GV44Gu5pu45bqXIOS9j-WQiOW6lw!5e0!3m2!1sja!2sjp!4v1712765800000!5m2!1sja!2sjp" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
