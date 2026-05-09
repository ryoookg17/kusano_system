"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Lock, ArrowRight, X } from "lucide-react";

export default function SchoolMenu() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [inputCode, setInputCode] = useState("");
  const [accessKeys, setAccessKeys] = useState<any[]>([]);
  const [isError, setIsError] = useState(false);

  // メニュー定義
  const menuButtons = [
    {
      id: "textbook",
      title: "補助教材 注文フォームへ進む",
      desc: "▼ 補助教材のご注文",
      link: "/order/textbook",
      bgColor: "var(--kusano-theme)",
    },
    {
      id: "schoolbook",
      title: "学校図書 注文フォームへ進む",
      desc: "▼ 学校図書のご注文",
      link: "/order/schoolbook",
      bgColor: "var(--kusano-accent-enji)",
    },
    {
      id: "shipping",
      title: "郵送依頼フォームへ進む",
      desc: "▼ 教材の郵送依頼はこちら",
      link: "/order/shipping",
      bgColor: "var(--kusano-accent-navy)",
    },
  ];

  useEffect(() => {
    // データベースから最新のアクセスキー情報をすべて取得
    async function fetchKeys() {
      const { data } = await supabase.from("access_keys").select("key_type, access_code, target_value");
      if (data) {
        setAccessKeys(data);
      }
    }
    fetchKeys();
  }, []);

  const handleButtonClick = (btn: any) => {
    // 未認証ならモーダルを開く
    setSelectedMenu(btn);
    setIsModalOpen(true);
    setInputCode("");
    setIsError(false);
  };

  const handleVerify = () => {
    // 入力されたコードに一致する設定を探す
    const match = accessKeys.find(k => k.access_code === inputCode);

    if (match) {
      // 成功：セッションに保存
      sessionStorage.setItem(`auth_${match.key_type}`, "true");

      let finalLink = selectedMenu.link;
      // もし遷移先（特定の学校名など）が設定されている場合は、クエリパラメータとして付与
      if (match.target_value) {
        finalLink += `?school=${encodeURIComponent(match.target_value)}`;
      }

      router.push(finalLink);
    } else {
      // 照合失敗
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", textAlign: "center" }}>
      <h2 className="section-heading" style={{ marginBottom: "1rem" }}>学校関係者様 メニュー</h2>
      <p style={{ marginBottom: "40px", color: "#666" }}>ご利用になるサービスを選択してください。</p>

      {menuButtons.map((btn, index) => (
        <div key={index} style={{ marginBottom: "30px" }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px", textAlign: "left", fontWeight: "bold" }}>
            {btn.desc}
          </p>
          <button
            onClick={() => handleButtonClick(btn)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "100%",
              padding: "20px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "white",
              backgroundColor: btn.bgColor,
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s, filter 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.filter = "none";
            }}
          >
            {btn.title}
            <ArrowRight size={20} />
          </button>
        </div>
      ))}

      {/* 認証モーダル */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white", padding: "40px 30px", borderRadius: "16px",
            maxWidth: "400px", width: "100%", textAlign: "center", position: "relative",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "none", cursor: "pointer", color: "#666" }}
            >
              <X size={24} />
            </button>

            <div style={{ display: "inline-flex", padding: "15px", backgroundColor: "#fef3c7", borderRadius: "50%", marginBottom: "20px" }}>
              <Lock size={32} color="#d97706" />
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "10px", color: "#1e293b" }}>合言葉を入力してください</h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "25px" }}>
              このフォームは学校関係者様専用です。<br />
              案内されているコードを入力してください。
            </p>

            <input 
              type="text"
              autoFocus
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="ここにコードを入力"
              style={{
                width: "100%", padding: "12px", fontSize: "1.2rem", textAlign: "center",
                borderRadius: "8px", border: isError ? "2px solid #ef4444" : "2px solid #e2e8f0",
                marginBottom: "20px", fontWeight: "bold", outline: "none"
              }}
            />

            {isError && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "15px", fontWeight: "bold" }}>
                合言葉が正しくありません
              </p>
            )}

            <button 
              onClick={handleVerify}
              style={{
                width: "100%", padding: "14px", backgroundColor: "#1e293b", color: "white",
                border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem",
                cursor: "pointer", transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#334155"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#1e293b"}
            >
              認証して進む
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
