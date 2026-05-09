"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, ChevronRight } from "lucide-react";

interface Announcement {
  id: string;
  created_at: string;
  title: string;
  content: string;
  image_urls: string[];
  is_published: boolean;
}

export default function AnnouncementsListPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setAnnouncements(data || []);
      }
      setLoading(false);
    }
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: "center", padding: "100px 0" }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="main-container">
      <h1 className="section-heading" style={{ borderBottom: "2px solid var(--kusano-theme)", width: "100%", paddingBottom: "10px", marginBottom: "40px" }}>
        お知らせ一覧
      </h1>

      {announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
          現在、お知らせはありません。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          {announcements.map((ann) => (
            <article 
              key={ann.id} 
              id={`id-${ann.id}`}
              style={{ 
                scrollMarginTop: "100px",
                borderBottom: "1px solid #eee",
                paddingBottom: "40px"
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#666", fontSize: "0.9rem", marginBottom: "10px" }}>
                  <Calendar size={16} />
                  <time>{new Date(ann.created_at).toLocaleDateString("ja-JP", { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                </div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#111", margin: 0, lineHeight: "1.4" }}>
                  {ann.title}
                </h2>
              </div>

              <div style={{ 
                whiteSpace: "pre-wrap", 
                fontSize: "1.1rem", 
                lineHeight: "1.8", 
                color: "#333",
                marginBottom: "25px" 
              }}>
                {ann.content}
              </div>

              {ann.image_urls && ann.image_urls.length > 0 && (
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: ann.image_urls.length === 1 ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", 
                  gap: "15px" 
                }}>
                  {ann.image_urls.map((url, i) => (
                    <div key={i} style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      <img 
                        src={url} 
                        alt={`${ann.title} - ${i + 1}`} 
                        style={{ width: "100%", height: "auto", display: "block" }} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
