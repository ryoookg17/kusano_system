"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, ShieldCheck, Key, Loader2 } from "lucide-react";
import SectionGuard from "@/components/SectionGuard";


export default function SettingsPage() {
  return (
    <SectionGuard sectionId="settings" sectionName="設定管理">
      <SettingsContent />
    </SectionGuard>
  );
}



function SettingsContent() {

  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const { data, error } = await supabase
      .from('access_keys')
      .select('*')
      .order('key_type');
    
    if (error) {
      console.error(error);
      alert("設定の取得に失敗しました");
    } else {
      let fetchedKeys = data || [];
      // 通知用メールアドレスの設定がない場合は、入力用の空行を追加
      if (!fetchedKeys.find(k => k.key_type === 'admin_notification_email')) {
        fetchedKeys = [
          { key_type: 'admin_notification_email', access_code: '', updated_at: new Date().toISOString() },
          ...fetchedKeys
        ];
      }
      setKeys(fetchedKeys);
    }
    setLoading(false);
  }

  const handleCodeChange = (id: string, newCode: string) => {
    setKeys(keys.map(k => k.id === id ? { ...k, access_code: newCode } : k));
  };

  const saveAccessKeys = async () => {
    setSaving(true);
    try {
      for (const key of keys) {
        const { error } = await supabase
          .from('access_keys')
          .update({
            access_code: key.access_code,
            updated_at: new Date().toISOString()
          })
          .eq('key_type', key.key_type);
        
        if (error) {
          console.error(`Error saving ${key.key_type}:`, error);
          if (error.code === '42501') {
             alert(`${labelMap[key.key_type] || key.key_type} の保存権限がありません。`);
          }
        }
      }
      alert("認証コードを更新しました");
      fetchKeys();
    } catch (error: any) {
      console.error(error);
      alert("保存中にエラーが発生しました: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const labelMap: Record<string, string> = {
    admin_notification_email: "注文通知先メールアドレス",
    textbook: "補助教材：認証コード",
    schoolbook: "学校図書：認証コード",
    shipping: "郵送依頼：共通（学校選択あり）",
    shipping_industrial: "【個別】長崎工業高校：専用コード",
    shipping_north: "【個別】長崎北高校：専用コード",
    shipping_seiun: "【個別】青雲高校：専用コード",
    shipping_chinzei: "【個別】鎮西高校：専用コード"
  };

  const keyOrder = [
    "textbook",
    "schoolbook",
    "shipping",
    "shipping_industrial",
    "shipping_north",
    "shipping_seiun",
    "shipping_chinzei"
  ];

  const emailKey = keys.find(k => k.key_type === 'admin_notification_email');
  const authKeys = keys
    .filter(k => k.key_type !== 'admin_notification_email')
    .sort((a, b) => {
      const idxA = keyOrder.indexOf(a.key_type);
      const idxB = keyOrder.indexOf(b.key_type);
      return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
    });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "50px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>設定管理</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px", color: "#94a3b8" }}>
          <Loader2 className="animate-spin" size={48} style={{ margin: "0 auto 20px" }} />
          読み込み中...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* メールアドレス設定セクション */}
          <section style={{ backgroundColor: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "#fff7ed", padding: "8px", borderRadius: "10px" }}>
                <ShieldCheck size={24} color="#ea580c" />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: "#1e293b" }}>通知設定</h2>
            </div>

            {emailKey && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ backgroundColor: "#fff7ed", padding: "20px", borderRadius: "12px", border: "1px solid #fdba74" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#c2410c", marginBottom: "8px" }}>
                    {labelMap.admin_notification_email}
                  </label>
                  <input 
                    type="email" 
                    value={emailKey.access_code}
                    onChange={(e) => handleCodeChange(emailKey.id, e.target.value)}
                    placeholder="example@kusano.jp"
                    style={{ 
                      width: "100%", 
                      padding: "12px 16px", 
                      borderRadius: "10px", 
                      border: "2px solid #fdba74",
                      fontSize: "1.1rem",
                      color: "#0f172a",
                      outline: "none",
                      backgroundColor: "white"
                    }}
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <button 
                    onClick={saveAccessKeys}
                    disabled={saving}
                    style={{ 
                      display: "inline-flex", alignItems: "center", gap: "8px", 
                      backgroundColor: "#ea580c", color: "white", border: "none", 
                      padding: "10px 24px", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", 
                      fontWeight: "bold", fontSize: "0.9rem",
                      transition: "background-color 0.2s"
                    }}
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>設定を保存</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 認証コード設定セクション */}
          <section style={{ backgroundColor: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "#f0fdf4", padding: "8px", borderRadius: "10px" }}>
                <Key size={24} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: "#1e293b" }}>認証コードの設定</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px", gap: "15px", padding: "0 20px", fontWeight: "bold", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <div>対象フォーム</div>
                <div style={{ textAlign: "center" }}>認証コード</div>
                <div style={{ textAlign: "center" }}>更新日</div>
              </div>

              {authKeys.map((k) => (
                <div key={k.id} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 200px 120px", 
                  gap: "15px", 
                  alignItems: "center", 
                  backgroundColor: k.key_type.startsWith('shipping_') && k.key_type !== 'shipping' ? "#f8fafc" : "white", 
                  padding: "12px 20px", 
                  borderRadius: "12px", 
                  border: "1px solid #f1f5f9",
                  transition: "background-color 0.2s"
                }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#334155" }}>
                    {labelMap[k.key_type] || k.key_type}
                  </div>
                  
                  <input 
                    type="text" 
                    value={k.access_code}
                    onChange={(e) => handleCodeChange(k.id, e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "10px", 
                      borderRadius: "8px", 
                      border: "2px solid #e2e8f0",
                      fontSize: "1rem",
                      fontWeight: "700", 
                      textAlign: "center", 
                      color: "#0f172a",
                      backgroundColor: "white",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#16a34a"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />

                  <div style={{ color: "#94a3b8", fontSize: "0.75rem", textAlign: "center" }}>
                    {new Date(k.updated_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "32px", textAlign: "right" }}>
              <button 
                onClick={saveAccessKeys}
                disabled={saving}
                style={{ 
                  display: "inline-flex", alignItems: "center", gap: "8px", 
                  backgroundColor: "#16a34a", color: "white", border: "none", 
                  padding: "10px 24px", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", 
                  fontWeight: "bold", fontSize: "0.9rem",
                  transition: "background-color 0.2s"
                }}
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>認証コードを保存</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

