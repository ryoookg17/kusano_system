"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SectionGuard from "@/components/SectionGuard";

import { supabase } from "@/lib/supabaseClient";
import { Download, ChevronDown, ChevronUp, CheckCircle, Trash2 } from "lucide-react";
import { saveAs } from "file-saver";

function SchoolbookAdminContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
  }, []);

  useEffect(() => {
    if (targetId && orders.length > 0) {
      setExpandedRow(targetId);
      setTimeout(() => {
        const element = document.getElementById(`order-${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [targetId, orders]);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('schoolbook_orders')
        .select(`
          *,
          items:schoolbook_order_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
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
        .from('schoolbook_orders')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error(error);
      alert("状態更新に失敗しました");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "完了" ? "未対応" : "完了";
    await handleStatusChange(id, newStatus);
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("この注文データを削除してもよろしいですか？（注文内容もすべて削除されます）")) return;
    try {
      const { error } = await supabase.from("schoolbook_orders").delete().eq("id", id);
      if (error) throw error;
      setOrders(orders.filter(o => o.id !== id));
      setSelectedIds(new Set(Array.from(selectedIds).filter(sid => sid !== id)));
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    }
  };


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
    const targetIds = selectedIds.size > 0 
      ? Array.from(selectedIds)
      : filteredOrders.map(o => o.id);

    if (targetIds.length === 0) {
      alert("ダウンロードするデータがありません。");
      return;
    }

    const url = `/api/schoolbook-excel?ids=${targetIds.join(",")}`;
    triggerDownload(url, "学校図書注文一覧.xlsx");
  };

  const filteredOrders = orders.filter(o => {
    const matchSchool = filterSchool ? o.school_name?.includes(filterSchool) : true;
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSchool && matchStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#000" }}>学校図書 管理</h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {selectedIds.size > 0 && (
            <>
              <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>
                {selectedIds.size}件 選択中
              </span>
            </>
          )}
          <button 
            onClick={downloadExcel}
            style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#059669", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            <Download size={18} /> Excel出力
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: "20px", display: "flex", gap: "25px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ fontWeight: "bold", color: "#000" }}>学校名：</label>
            <input 
              type="text"
              value={filterSchool}
              onChange={(e) => {
                setFilterSchool(e.target.value);
                setSelectedIds(new Set());
              }}
              placeholder="学校名の一部..."
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "200px", backgroundColor: "white", color: "#000" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ fontWeight: "bold", color: "#000" }}>状態：</label>
            <select 
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setSelectedIds(new Set());
              }}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}
            >
              <option value="">すべて</option>
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
                <th style={{ padding: "12px 15px", width: "40px" }}>
                  <input 
                    type="checkbox" 
                    checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                    onChange={toggleSelectAll}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981", colorScheme: "light" }}
                  />
                </th>
                <th style={{ padding: "12px 15px", color: "#000", fontWeight: "bold" }}>詳細</th>
                <th style={{ padding: "12px 15px", color: "#000", fontWeight: "bold" }}>日時</th>
                <th style={{ padding: "12px 15px", width: "160px", color: "#000", fontWeight: "bold" }}>学校名</th>
                <th style={{ padding: "12px 15px", width: "130px", color: "#000", fontWeight: "bold" }}>ご担当者名</th>
                <th style={{ padding: "12px 15px", color: "#000", fontWeight: "bold" }}>注文数</th>
                <th style={{ padding: "12px 15px", textAlign: "center", color: "#000", fontWeight: "bold" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>読み込み中...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>注文データがありません</td></tr>
              ) : (
                filteredOrders.map(order => {
                  const isExpanded = expandedRow === order.id;
                  const itemTypesCount = order.items?.length || 0;
                  const totalBooksCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  const dateStr = order.created_at ? new Date(order.created_at).toLocaleString('ja-JP').replace(/,/g, '') : "";

                  const isDone = order.status === "完了";

                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        id={`order-${order.id}`} 
                        style={{ 
                          borderBottom: isExpanded ? "none" : "1px solid #f1f5f9", 
                          cursor: "pointer", 
                          backgroundColor: isExpanded ? "#f8fafc" : "transparent",
                          opacity: isDone ? 0.4 : 1
                        }} 
                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                      >
                        <td style={{ padding: "15px" }} onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981", colorScheme: "light" }}
                          />
                        </td>
                        <td style={{ padding: "15px", color: "#000" }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </td>
                        <td style={{ padding: "15px", whiteSpace: "nowrap", color: "#0f172a", fontWeight: "500" }}>{dateStr}</td>
                        <td style={{ padding: "15px", fontWeight: "bold", color: "#0f172a", fontSize: "1.05rem", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.school_name}</td>
                        <td style={{ padding: "15px", color: "#0f172a", fontWeight: "500", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.teacher_name}</td>
                        <td style={{ padding: "15px", fontWeight: "bold", color: "#059669", fontSize: "1.05rem" }}>
                          {itemTypesCount}種類 <span style={{ fontWeight: "bold", color: "#334155" }}>/ 計{totalBooksCount}冊</span>
                        </td>
                        <td style={{ padding: "15px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => deleteOrder(order.id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="削除"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ borderBottom: "2px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                          <td colSpan={7} style={{ padding: "0 20px 20px 50px" }}>
                            <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              {order.remarks && (
                                <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px" }}>
                                  <h4 style={{ fontSize: "0.85rem", color: "#92400e", margin: "0 0 5px 0", fontWeight: "bold" }}>備考</h4>
                                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#000", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{order.remarks}</p>
                                </div>
                              )}
                              <h4 style={{ fontSize: "0.85rem", color: "#000", margin: "0 0 10px 0", fontWeight: "bold" }}>注文図書の内訳</h4>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                  <tr style={{ borderBottom: "2px solid #94a3b8", color: "#0f172a", backgroundColor: "#e2e8f0" }}>
                                    <th style={{ padding: "8px 5px", textAlign: "center", fontWeight: "bold" }}>番号</th>
                                    <th style={{ padding: "8px 5px", textAlign: "left", fontWeight: "bold" }}>書名</th>
                                    <th style={{ padding: "8px 5px", textAlign: "left", fontWeight: "bold" }}>著者 / 出版社</th>
                                    <th style={{ padding: "8px 5px", textAlign: "center", fontWeight: "bold" }}>ISBN</th>
                                    <th style={{ padding: "8px 5px", textAlign: "right", fontWeight: "bold" }}>税込価格</th>
                                    <th style={{ padding: "8px 5px", textAlign: "right", fontWeight: "bold" }}>冊数</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items?.map((item: any) => (
                                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "10px 5px", textAlign: "center", color: "#475569", fontWeight: "bold" }}>{item.serial_number}</td>
                                      <td style={{ padding: "10px 5px", fontWeight: "bold", fontSize: "0.95rem", color: "#0f172a" }}>{item.book_title}</td>
                                      <td style={{ padding: "10px 5px", color: "#1e293b", fontWeight: "500" }}>{item.author}<br/><span style={{ color: "#475569", fontSize: "0.85rem", fontWeight: "normal" }}>{item.publisher}</span></td>
                                      <td style={{ padding: "10px 5px", textAlign: "center", fontFamily: "monospace", color: "#334155", fontWeight: "bold" }}>{item.isbn || "-"}</td>
                                      <td style={{ padding: "10px 5px", textAlign: "right", color: "#dc2626", fontWeight: "bold" }}>{item.price_including_tax ? `¥${item.price_including_tax.toLocaleString()}` : "-"}</td>
                                      <td style={{ padding: "10px 5px", textAlign: "right", fontWeight: "bold", fontSize: "1.1rem", color: "#2563eb" }}>{item.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default function SchoolbookAdminPage() {
  return (
    <SectionGuard sectionId="schoolbook" sectionName="学校図書管理">
      <Suspense fallback={<div>読み込み中...</div>}>
        <SchoolbookAdminContent />
      </Suspense>
    </SectionGuard>
  );
}

