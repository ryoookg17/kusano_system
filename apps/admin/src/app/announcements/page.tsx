"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2, Image as ImageIcon, CheckCircle, XCircle, Save, X, Loader2 } from "lucide-react";

interface Announcement {
  id: string;
  created_at: string;
  title: string;
  content: string;
  image_urls: string[];
  is_published: boolean;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 編集用フォームの状態
  const [form, setForm] = useState({
    id: "",
    title: "",
    content: "",
    image_urls: [] as string[],
    is_published: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const handleOpenNew = () => {
    setForm({ id: "", title: "", content: "", image_urls: [], is_published: true });
    setIsEditing(true);
  };

  const handleEdit = (ann: Announcement) => {
    setForm({ ...ann });
    setIsEditing(true);
  };

  const handleClose = () => {
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.image_urls.length + files.length > 3) {
      alert("画像は最大3枚までです。");
      return;
    }

    setIsUploading(true);
    const newUrls = [...form.image_urls];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcement-pics/${fileName}`;

      const { data, error } = await supabase.storage
        .from('announcements') // バケット名は 'announcements'
        .upload(filePath, file);

      if (error) {
        console.error("Upload error:", error);
        alert(`画像「${file.name}」のアップロードに失敗しました。ストレージのバケット設定を確認してください。`);
        continue;
      }

      // 公開URLの取得
      const { data: { publicUrl } } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);
      
      newUrls.push(publicUrl);
    }

    setForm({ ...form, image_urls: newUrls });
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const newUrls = form.image_urls.filter((_, i) => i !== index);
    setForm({ ...form, image_urls: newUrls });
  };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      alert("タイトルと内容を入力してください。");
      return;
    }

    if (form.id) {
      // 更新
      const { error } = await supabase
        .from("announcements")
        .update({
          title: form.title,
          content: form.content,
          image_urls: form.image_urls,
          is_published: form.is_published,
          updated_at: new Date().toISOString()
        })
        .eq("id", form.id);
      
      if (error) alert("更新に失敗しました。");
    } else {
      // 新規作成
      const { error } = await supabase
        .from("announcements")
        .insert([{
          title: form.title,
          content: form.content,
          image_urls: form.image_urls,
          is_published: form.is_published
        }]);
      
      if (error) alert("作成に失敗しました。");
    }

    setIsEditing(false);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このお知らせを削除してもよろしいですか？")) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);
    
    if (error) alert("削除に失敗しました。");
    else fetchAnnouncements();
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_published: !currentStatus })
      .eq("id", id);
    
    if (error) alert("更新に失敗しました。");
    else fetchAnnouncements();
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>お知らせ管理</h1>
          <p style={{ color: "#334155", marginTop: "5px", fontWeight: "500" }}>ホームページの新着情報・お知らせ一覧を更新します。</p>
        </div>
        
        <button 
          onClick={handleOpenNew}
          style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1e293b", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          <Plus size={20} /> 新規作成
        </button>
      </div>

      {isEditing && (
        <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginBottom: "30px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>{form.id ? "お知らせを編集" : "新しいお知らせを作成"}</h2>
            <button onClick={handleClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#334155" }}><X size={24} /></button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#1e293b" }}>タイトル</label>
              <input 
                type="text" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                placeholder="例：夏休みの営業時間について"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#1e293b" }}>内容</label>
              <textarea 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})} 
                rows={8}
                placeholder="お知らせの本文を入力してください"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #94a3b8", color: "#0f172a", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#475569" }}>画像（最大3枚まで）</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                {form.image_urls.map((url, i) => (
                  <div key={i} style={{ position: "relative", width: "120px", height: "120px" }}>
                    <img src={url} alt="upload" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <button 
                      onClick={() => removeImage(i)}
                      style={{ position: "absolute", top: "-8px", right: "-8px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {form.image_urls.length < 3 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{ width: "120px", height: "120px", borderRadius: "8px", border: "2px dashed #cbd5e1", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "#64748b" }}
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={24} /> : <><ImageIcon size={24} /><span style={{ fontSize: "12px", marginTop: "5px" }}>追加する</span></>}
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                multiple 
                style={{ display: "none" }} 
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input 
                type="checkbox" 
                id="is_published" 
                checked={form.is_published} 
                onChange={e => setForm({...form, is_published: e.target.checked})}
                style={{ width: "18px", height: "18px" }}
              />
              <label htmlFor="is_published" style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer" }}>今すぐ公開する</label>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button 
                onClick={handleSave}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "#059669", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                <Save size={20} /> 保存して完了
              </button>
              <button 
                onClick={handleClose}
                style={{ flex: 1, backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>読み込み中...</div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", backgroundColor: "white", borderRadius: "12px", color: "#64748b", border: "1px dashed #cbd5e1" }}>
          まだお知らせがありません。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {announcements.map((ann) => (
            <div key={ann.id} style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                {ann.image_urls && ann.image_urls[0] ? (
                  <img src={ann.image_urls[0]} alt="thumb" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", backgroundColor: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}>
                    <ImageIcon size={30} />
                  </div>
                )}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0, color: "#000" }}>{ann.title}</h3>
                    <span style={{ 
                      fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold",
                      backgroundColor: ann.is_published ? "#dcfce3" : "#f1f5f9",
                      color: ann.is_published ? "#16a34a" : "#64748b"
                    }}>
                      {ann.is_published ? "公開中" : "非公開"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "#334155", margin: 0, fontWeight: "600" }}>
                    {new Date(ann.created_at).toLocaleDateString("ja-JP", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  onClick={() => togglePublish(ann.id, ann.is_published)}
                  title={ann.is_published ? "非公開にする" : "公開する"}
                  style={{ border: "none", background: "none", cursor: "pointer", color: ann.is_published ? "#ef4444" : "#059669", padding: "8px" }}
                >
                  {ann.is_published ? <XCircle size={20} /> : <CheckCircle size={20} />}
                </button>
                <button 
                  onClick={() => handleEdit(ann)}
                  style={{ backgroundColor: "#f1f5f9", color: "#000", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
                >
                  編集
                </button>
                <button 
                  onClick={() => handleDelete(ann.id)}
                  style={{ backgroundColor: "#fee2e2", color: "#ef4444", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
