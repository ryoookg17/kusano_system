"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, ShieldCheck, Key, Loader2 } from "lucide-react";

export default function SettingsPage() {
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

  const saveKeys = async () => {
    setSaving(true);
    try {
      for (const key of keys) {
        // IDがある場合は既存更新、ない場合は新規作成(upsert)
        const payload: any = {
          key_type: key.key_type,
          access_code: key.access_code,
          updated_at: new Date().toISOString()
        };
        if (key.id) payload.id = key.id;

        const { error } = await supabase
          .from('access_keys')
          .upsert(payload);
        
        if (error) throw error;
      }
      alert("すべての設定を更新しました");
      fetchKeys();
    } catch (error: any) {
      console.error(error);
      alert("保存中にエラーが発生しました: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const labelMap: Record<string, string> = {
    admin_notification_email: "【重要】注文通知先メールアドレス",
    textbook: "補助教材：合言葉",
    schoolbook: "学校図書：合言葉",
    shipping: "郵送依頼：共通（学校選択あり）",
    shipping_industrial: "【個別】長崎工業高校：専用コード",
    shipping_north: "【個別】長崎北高校：専用コード",
    shipping_seiun: "【個別】青雲高校：専用コード",
    shipping_chinzei: "【個別】鎮西高校：専用コード"
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>設定管理</h1>
      </div>

      <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px", paddingBottom: "15px", borderBottom: "1px solid #f1f5f9" }}>
          <ShieldCheck size={24} color="#059669" />
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: "#1e293b" }}>アクセスキー（合言葉）の設定</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 10px" }} />
            読み込み中...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 150px", gap: "15px", padding: "0 20px", fontWeight: "bold", fontSize: "0.85rem", color: "#64748b" }}>
              <div>対象フォーム</div>
              <div style={{ textAlign: "center" }}>合言葉</div>
              <div style={{ textAlign: "center" }}>最終更新</div>
            </div>

              <div key={k.id} style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 280px 150px", 
                gap: "15px", 
                alignItems: "center", 
                backgroundColor: k.key_type === 'admin_notification_email' ? "#fff7ed" : (k.key_type.startsWith('shipping_') ? "#f0fdf4" : "#f8fafc"), 
                padding: "15px 20px", 
                borderRadius: "12px", 
                border: k.key_type === 'admin_notification_email' ? "1px solid #fdba74" : "1px solid #e2e8f0" 
              }}>
                <div style={{ fontSize: "1rem", fontWeight: "bold", color: k.key_type === 'admin_notification_email' ? "#c2410c" : "#1e293b" }}>
                  {labelMap[k.key_type] || k.key_type}
                </div>
                
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    value={k.access_code}
                    onChange={(e) => handleCodeChange(k.id, e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "10px", 
                      borderRadius: "8px", 
                      border: "2px solid #cbd5e1",
                      fontSize: "1.1rem",
                      fontWeight: "bold", 
                      textAlign: "center", 
                      color: "#0f172a",
                      backgroundColor: "white",
                      outline: "none",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#059669"}
                    onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                  />
                </div>

                <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center" }}>
                  {new Date(k.updated_at).toLocaleDateString('ja-JP')}<br />
                  {new Date(k.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            ))}

            <div style={{ marginTop: "30px", textAlign: "right" }}>
              <button 
                onClick={saveKeys}
                disabled={saving}
                style={{ 
                  display: "inline-flex", alignItems: "center", gap: "8px", 
                  backgroundColor: "#059669", color: "white", border: "none", 
                  padding: "14px 40px", borderRadius: "10px", cursor: "pointer", 
                  fontWeight: "bold", fontSize: "1rem",
                  boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.3)",
                  transition: "transform 0.2s, background-color 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.backgroundColor = "#047857";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.backgroundColor = "#059669";
                }}
              >
                {saving ? <><Loader2 className="animate-spin" size={20} /> 保存中...</> : <><Save size={20} /> 設定を保存する</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#fff7ed", borderRadius: "12px", border: "1px solid #fdba74", display: "flex", gap: "12px", alignItems: "center" }}>
        <Loader2 size={20} color="#c2410c" />
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#c2410c", fontWeight: "bold" }}>
          ※通知先メールアドレスを変更すると、以降のすべての注文通知が新しいアドレスに届くようになります。
        </p>
      </div>

      <div style={{ marginTop: "40px", padding: "25px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", display: "flex", gap: "15px", alignItems: "flex-start" }}>
        <Key size={24} color="#b45309" style={{ marginTop: "2px" }} />
        <div>
          <h4 style={{ color: "#92400e", margin: "0 0 8px 0", fontSize: "1rem", fontWeight: "bold" }}>合言葉の管理について</h4>
          <p style={{ color: "#b45309", fontSize: "0.9rem", margin: 0, lineHeight: "1.6" }}>
            ここで設定した「合言葉」は、各学校の先生や生徒が注文フォームにアクセスする際に使用します。<br />
            学期の変わり目や、セキュリティを高めたい場合に定期的に変更することをお勧めします。
          </p>
        </div>
      </div>
    </div>
  );
}
