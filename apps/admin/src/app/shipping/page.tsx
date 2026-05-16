"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SectionGuard from "@/components/SectionGuard";

import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { Download, CheckCircle, Trash2 } from "lucide-react";
import { saveAs } from "file-saver";

function ShippingAdminContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("すべて");
  const [filterStatus, setFilterStatus] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchRequests();
  }, []);

  useEffect(() => {
    if (targetId && requests.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`request-${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [targetId, requests]);

  async function fetchRequests() {
    try {
      const { data, error } = await supabase
        .from('shipping_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error(error);
      alert("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('shipping_requests')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } catch (error) {
      console.error(error);
      alert("状態更新に失敗しました");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "完了" ? "未対応" : "完了";
    await handleStatusChange(id, newStatus);
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("この郵送依頼データを削除してもよろしいですか？")) return;
    try {
      const { error } = await supabase.from("shipping_requests").delete().eq("id", id);
      if (error) throw error;
      setRequests(requests.filter(req => req.id !== id));
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    }
  };


  const schools = ["すべて", ...Array.from(new Set(requests.map(r => r.school_name))).sort()];

  const filteredRequests = requests.filter(r => {
    const matchSchool = activeTab === "すべて" ? true : r.school_name === activeTab;
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchSchool && matchStatus;
  });

  const triggerDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await response.blob();
      saveAs(blob, fileName);
    } catch (error) {
      console.error(error);
      alert("ダウンロードエラーが発生しました。");
    }
  };

  const downloadExcel = () => {
    const targetIds = filteredRequests.map(r => r.id);
    if (targetIds.length === 0) return alert("ダウンロードするデータがありません。");
    const url = `/api/shipping-excel?ids=${targetIds.join(",")}`;
    triggerDownload(url, "郵送依頼一覧.xlsx");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#000" }}>郵送依頼 管理</h1>
        </div>
        
        <button 
          onClick={downloadExcel}
          style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#059669", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          <Download size={18} /> Excel出力
        </button>
      </div>

      {/* 学校別タブ */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "20px", overflowX: "auto", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
        {schools.map(school => (
          <button
            key={school}
            onClick={() => setActiveTab(school)}
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              border: activeTab === school ? "none" : "1px solid #cbd5e1",
              backgroundColor: activeTab === school ? "#1e293b" : "white",
              color: activeTab === school ? "white" : "#475569",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: "bold",
              fontSize: "0.9rem"
            }}
          >
            {school}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: "20px", display: "flex", gap: "25px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ fontWeight: "bold", color: "#000" }}>状態で絞り込み：</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "black" }}
            >
              <option value="">すべて表示</option>
              <option value="未対応">未対応</option>
              <option value="手配中">手配中</option>
              <option value="完了">完了</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ccc", color: "#000", fontWeight: "bold" }}>
                <th style={{ padding: "12px 15px", whiteSpace: "nowrap", color: "#000" }}>日時</th>
                <th style={{ padding: "12px 15px", whiteSpace: "nowrap", width: "160px", color: "#000" }}>学校</th>
                <th style={{ padding: "12px 15px", whiteSpace: "nowrap", width: "130px", color: "#000" }}>生徒名</th>
                <th style={{ padding: "12px 15px", whiteSpace: "nowrap", color: "#000" }}>連絡先/住所</th>
                <th style={{ padding: "12px 15px", whiteSpace: "nowrap", textAlign: "center", color: "#000" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>読み込み中...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>依頼データがありません</td></tr>
              ) : (
                filteredRequests.map(req => {
                  const isDone = req.status === "完了";
                  return (
                    <tr 
                      key={req.id} 
                      id={`request-${req.id}`}
                      style={{ 
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: targetId === req.id ? "#fef9c3" : "transparent",
                        opacity: isDone ? 0.4 : 1,
                        transition: "background-color 0.5s"
                      }}
                    >
                      <td style={{ padding: "15px", whiteSpace: "nowrap", color: "#0f172a", fontWeight: "500" }}>
                        {isMounted ? format(new Date(req.created_at), "yyyy/MM/dd HH:mm") : ""}
                      </td>
                      <td style={{ padding: "15px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "#0f172a", fontSize: "1.05rem" }}>{req.school_name}</strong><br/>
                        <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "bold" }}>{req.grade} {req.course}</span>
                      </td>
                      <td style={{ padding: "15px", fontWeight: "bold", color: "#0f172a", fontSize: "1.05rem", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.student_name}</td>
                      <td style={{ padding: "15px" }}>
                        <div style={{ fontSize: "0.9rem", color: "#0f172a", marginBottom: "3px", fontWeight: "500" }}>〒{req.zipcode} <br/>{req.address}</div>
                        <div style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "bold" }}>TEL: {req.phone}</div>
                      </td>
                        <td style={{ padding: "15px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                            <button 
                              onClick={() => deleteRequest(req.id)}
                              style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                              title="削除"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button 
                              onClick={() => toggleStatus(req.id, req.status)}
                              style={{ border: "none", background: "none", cursor: "pointer", color: isDone ? "#000" : "#ccc" }}
                              title={isDone ? "未対応に戻す" : "完了にする"}
                            >
                              <CheckCircle size={22} />
                            </button>
                          </div>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ShippingAdminPage() {
  return (
    <SectionGuard sectionId="shipping" sectionName="郵送管理">
      <Suspense fallback={<div>読み込み中...</div>}>
        <ShippingAdminContent />
      </Suspense>
    </SectionGuard>
  );
}

