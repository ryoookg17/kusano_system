"use client";

import { schoolData } from "@shared/schools";

import React, { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import {
  Download,
  FileSpreadsheet,
  PlusCircle,
  CheckCircle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { saveAs } from "file-saver";



function TextbookAdminContent() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterSchool, setFilterSchool] = useState("");
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("textbook_order_items")
        .select(`
          *,
          order:textbook_orders(*)
        `);

      if (error) throw error;

      // HPの注文日時（order.created_at）を基準に降順でソートする
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(a.order?.created_at || a.created_at || 0).getTime();
        const dateB = new Date(b.order?.created_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setItems(sortedData);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }


  const toggleStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === "完了" ? "未対応" : "完了";
    try {
      const { error } = await supabase
        .from("textbook_order_items")
        .update({ status: newStatus })
        .eq("id", itemId);

      if (error) throw error;
      setItems(items.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
    } catch (error) {
      console.error("Status Toggle Error:", error);
      alert("ステータスの更新に失敗しました。DBの構築状況を確認してください。");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("このデータを削除してもよろしいですか？")) return;
    try {
      const { error } = await supabase.from("textbook_order_items").delete().eq("id", id);
      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    }
  };

  const triggerDownload = (url: string) => {
    window.location.href = url;
  };

  const downloadAdoptionExcel = async () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return alert("出力するアイテムを選択してください。");
    
    // 出力状態を更新
    try {
      const { error } = await supabase
        .from("textbook_order_items")
        .update({ is_adoption_output: true })
        .in("id", selectedItems.map(i => i.id));
      if (error) throw error;
      fetchItems();
    } catch (e) {
      console.error("Status update error:", e);
    }

    const orderIds = Array.from(new Set(selectedItems.map(item => item.order_id)));
    triggerDownload(`/api/textbook-adoption-excel?ids=${orderIds.join(",")}`);
  };

  const downloadGeneralExcel = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    const targetIds = selectedItems.length > 0
      ? Array.from(new Set(selectedItems.map(item => item.order_id)))
      : Array.from(new Set(filteredItems.map(item => item.order_id)));

    if (targetIds.length === 0) return alert("データがありません。");
    triggerDownload(`/api/textbook-excel?ids=${targetIds.join(",")}`);
  };

  const downloadSingleOrderExcel = (orderId: string) => {
    if (!orderId) return;
    triggerDownload(`/api/textbook-order-excel/${orderId}`);
  };

  const filteredItems = items.filter(item => {
    // 検索フィルタ (学校名、書名、出版社)
    if (filterSchool) {
      const query = filterSchool.toLowerCase();
      const schoolMatch = item.order?.school_name?.toLowerCase().includes(query);
      const nameMatch = item.textbook_name?.toLowerCase().includes(query);
      const publisherMatch = item.publisher?.toLowerCase().includes(query);
      if (!schoolMatch && !nameMatch && !publisherMatch) return false;
    }
    
    // 年度フィルタ (注文日時から年を抽出)
    if (filterYear) {
      const itemDate = item.order?.created_at || item.created_at;
      if (itemDate) {
        const itemYear = new Date(itemDate).getFullYear().toString();
        if (itemYear !== filterYear) return false;
      }
    }

    // ステータスフィルタ
    if (filterStatus !== "all") {
      if (item.status !== filterStatus) return false;
    }

    return true;
  });

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      {/* ヘッダーエリア */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#000" }}>補助教材管理</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setIsEntryModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", color: "#000", border: "1.5px solid #000", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
          >
            <PlusCircle size={18} /> 注文を入力
          </button>
          <button
            onClick={downloadAdoptionExcel}
            style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", color: "#000", border: "1.5px solid #000", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
          >
            <FileSpreadsheet size={18} /> 採用注文書出力
          </button>
          <button
            onClick={downloadGeneralExcel}
            style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#059669", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
          >
            <Download size={18} /> Excel出力
          </button>
        </div>
      </div>

      {/* フィルタエリア */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: "white", color: "#000" }}
        >
          <option value="">すべての年度</option>
          {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
            <option key={year} value={year.toString()}>{year}年度</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: "white", color: "#000" }}
        >
          <option value="all">すべてのステータス</option>
          <option value="未対応">未対応</option>
          <option value="完了">完了</option>
        </select>

        <input
          type="text"
          placeholder="学校名・書名・出版社で検索..."
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "300px", fontSize: "0.9rem", backgroundColor: "white", color: "#000" }}
        />
      </div>

      {/* テーブルエリア (横スクロール対応) */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: "4px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #ccc" }}>
        <div style={{ overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", minWidth: "1200px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ccc", textAlign: "left", position: "sticky", top: 0, zIndex: 10 }}>
                <th style={{ padding: "12px 15px", width: "50px" }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredItems.map(i => i.id)));
                      else setSelectedIds(new Set());
                    }}
                    checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                  />
                </th>
                <th style={{ padding: "12px 15px", width: "100px", whiteSpace: "nowrap", color: "#000" }}>注文日</th>
                <th style={{ padding: "12px 15px", width: "80px", color: "#000" }}>帳合</th>
                <th style={{ padding: "12px 15px", minWidth: "250px", color: "#000" }}>教材名 / 出版社</th>
                <th style={{ padding: "12px 15px", width: "100px", textAlign: "right", whiteSpace: "nowrap", color: "#000" }}>本体価格</th>
                <th style={{ padding: "12px 15px", width: "100px", textAlign: "center", whiteSpace: "nowrap", color: "#000" }}>冊数(教員)</th>
                <th style={{ padding: "12px 15px", width: "180px", color: "#000" }}>学校名 / 先生名</th>
                <th style={{ padding: "12px 15px", width: "100px", textAlign: "center", whiteSpace: "nowrap", color: "#000" }}>学年</th>
                <th style={{ padding: "12px 15px", width: "100px", color: "#000" }}>教科</th>
                <th style={{ padding: "12px 15px", width: "100px", color: "#000" }}>状態</th>
                <th style={{ padding: "12px 15px", width: "80px", textAlign: "center", color: "#000" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: "40px", textAlign: "center" }}>読み込み中...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: "40px", textAlign: "center" }}>データがありません</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const isDone = item.status === "完了";
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #e5e5e5",
                        opacity: isDone ? 0.4 : 1,
                        backgroundColor: "white"
                      }}
                    >
                      <td style={{ padding: "10px 15px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            setSelectedIds(next);
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 15px", whiteSpace: "nowrap", fontSize: "0.85rem", color: "#333" }}>
                        {isMounted ? (item.order?.created_at
                          ? format(new Date(item.order.created_at), "yyyy/MM/dd")
                          : item.created_at
                            ? format(new Date(item.created_at), "yyyy/MM/dd")
                            : "-") : ""}
                      </td>
                      <td style={{ padding: "10px 15px", fontSize: "0.85rem", color: "#000" }}>
                        {item.accounting_vendor || "-"}
                      </td>
                      <td style={{ padding: "10px 15px" }}>
                        <div 
                          style={{ fontWeight: "bold", color: "#000", cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => setEditingItem(item)}
                        >
                          {item.textbook_name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#555" }}>{item.publisher}</div>
                      </td>
                      <td style={{ padding: "10px 15px", textAlign: "right", fontFamily: "monospace", color: "#000" }}>
                        {item.unit_price ? `¥${item.unit_price.toLocaleString()}` : "-"}
                      </td>
                      <td style={{ padding: "10px 15px", textAlign: "center", fontWeight: "bold", color: "#000" }}>
                        {(item.student_quantity || 0) + (item.teacher_quantity || 0)}
                        <span style={{ fontSize: "0.75rem", color: "#555", marginLeft: "4px" }}>({item.teacher_quantity || 0})</span>
                      </td>
                      <td style={{ padding: "10px 15px" }}>
                        <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#000" }}>{item.order?.school_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#555" }}>{item.order?.teacher_name}</div>
                      </td>
                      <td style={{ padding: "10px 15px", textAlign: "center", whiteSpace: "nowrap", color: "#000" }}>
                        {item.target_grade ? String(item.target_grade).split(/[、,]/).map(g => g.trim().includes("年") ? g.trim() : `${g.trim()}年`).join("、") : "-"}
                      </td>
                      <td style={{ padding: "10px 15px", color: "#000" }}>
                        <span style={{ backgroundColor: item.subject ? "#f1f5f9" : "#fee2e2", padding: "2px 6px", borderRadius: "3px", fontSize: "0.75rem", color: item.subject ? "#475569" : "#ef4444", fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {item.subject || "未設定"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 15px", color: "#000" }}>
                        <span style={{ 
                          backgroundColor: item.is_adoption_output ? "#ecfdf5" : "#fef2f2", 
                          padding: "2px 6px", borderRadius: "3px", fontSize: "0.75rem", 
                          color: item.is_adoption_output ? "#059669" : "#dc2626", 
                          fontWeight: "bold", whiteSpace: "nowrap",
                          border: `1px solid ${item.is_adoption_output ? "#10b981" : "#fecaca"}`
                        }}>
                          {item.is_adoption_output ? "採用注文書 出力済" : "未出力"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 15px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                          title="削除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 注文入力・編集モーダル */}
      {(isEntryModalOpen || editingItem) && (
        <OrderEntryModal
          initialItem={editingItem}
          onClose={() => {
            setIsEntryModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setIsEntryModalOpen(false);
            setEditingItem(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

// 注文入力用モーダルコンポーネント
export function OrderEntryModal({ onClose, onSuccess, initialItem }: { onClose: () => void, onSuccess: () => void, initialItem?: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");
  const [commonInfo, setCommonInfo] = useState({
    order_date: initialItem?.order?.created_at 
      ? new Date(initialItem.order.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    school_name: initialItem?.order?.school_name || "",
    teacher_name: initialItem?.order?.teacher_name || "",
    email: initialItem?.order?.email || "",
    school_phone: initialItem?.order?.school_phone || "",
    personal_phone: initialItem?.order?.personal_phone || "",
  });

  useEffect(() => {
    if (initialItem?.order?.school_name) {
      const area = Object.keys(schoolData).find(a => (schoolData as any)[a].includes(initialItem.order.school_name));
      if (area) setSelectedArea(area);
    }
  }, [initialItem]);

  const [orderItems, setOrderItems] = useState(initialItem ? [{
    textbook_name: initialItem.textbook_name || "",
    publisher: initialItem.publisher || "",
    subject: initialItem.subject || "",
    target_grades: initialItem.target_grade 
      ? String(initialItem.target_grade).split(/[、,]/).map((g: string) => {
          const trimmed = g.trim();
          if (!trimmed) return "";
          return trimmed.includes("年") ? trimmed : `${trimmed}年`;
        }).filter(Boolean)
      : [],
    student_quantity: String(initialItem.student_quantity || ""),
    teacher_quantity: String(initialItem.teacher_quantity || ""),
    main_item_type: initialItem.main_item_type || "冊子",
    answer_type: initialItem.answer_type || "なし",
    answer_attached: initialItem.answer_attached || "はずす",
    accessory_type: initialItem.accessory_type || "なし",
    accessory_attached: initialItem.accessory_attached || "はずす",
    delivery_method: initialItem.delivery_method || "納品",
    billing_target: initialItem.billing_target || "学校",
    requested_date: initialItem.requested_date || "",
    remarks: initialItem.remarks || "",
    unit_price: String(initialItem.unit_price || ""),
    accounting_vendor: initialItem.accounting_vendor || "",
  }] : [
    {
      textbook_name: "",
      publisher: "",
      subject: "",
      target_grades: [] as string[],
      student_quantity: "",
      teacher_quantity: "",
      main_item_type: "冊子",
      answer_type: "なし",
      answer_attached: "はずす",
      accessory_type: "なし",
      accessory_attached: "はずす",
      delivery_method: "納品",
      billing_target: "学校",
      requested_date: "",
      remarks: "",
      unit_price: "",
      accounting_vendor: "",
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialItem) {
        // 更新処理
        const { error: orderError } = await supabase
          .from('textbook_orders')
          .update({
            created_at: new Date(commonInfo.order_date).toISOString(),
            school_name: commonInfo.school_name,
            teacher_name: commonInfo.teacher_name,
            email: commonInfo.email,
            school_phone: commonInfo.school_phone,
            personal_phone: commonInfo.personal_phone
          })
          .eq('id', initialItem.order_id);
        
        if (orderError) throw orderError;

        const updatedItem = orderItems[0];
        const { error: itemError } = await supabase
          .from('textbook_order_items')
          .update({
            textbook_name: updatedItem.textbook_name,
            publisher: updatedItem.publisher,
            subject: updatedItem.subject,
            target_grade: updatedItem.target_grades.join("、"),
            student_quantity: parseInt(updatedItem.student_quantity || "0", 10),
            teacher_quantity: parseInt(updatedItem.teacher_quantity || "0", 10),
            main_item_type: updatedItem.main_item_type,
            answer_type: updatedItem.answer_type,
            answer_attached: updatedItem.answer_type !== "なし" ? updatedItem.answer_attached : null,
            accessory_type: updatedItem.accessory_type,
            accessory_attached: updatedItem.accessory_type !== "なし" ? updatedItem.accessory_attached : null,
            delivery_method: updatedItem.delivery_method,
            billing_target: updatedItem.delivery_method === "納品" ? updatedItem.billing_target : null,
            requested_date: updatedItem.delivery_method === "販売" && updatedItem.requested_date ? updatedItem.requested_date : null,
            remarks: updatedItem.remarks,
            unit_price: updatedItem.unit_price ? parseInt(updatedItem.unit_price, 10) : null,
            accounting_vendor: updatedItem.accounting_vendor
          })
          .eq('id', initialItem.id);
        
        if (itemError) throw itemError;

        alert("注文を更新しました。");
      } else {
        // 新規作成処理
        const orderId = crypto.randomUUID();
        const { error: orderError } = await supabase
          .from('textbook_orders')
          .insert([{
            id: orderId,
            created_at: new Date(commonInfo.order_date).toISOString(),
            school_name: commonInfo.school_name,
            teacher_name: commonInfo.teacher_name,
            email: commonInfo.email || "admin-entry@kusano.example",
            school_phone: commonInfo.school_phone,
            personal_phone: commonInfo.personal_phone
          }]);
        if (orderError) throw orderError;

        const itemsToSave = orderItems.map((item: any) => ({
          order_id: orderId,
          textbook_name: item.textbook_name,
          publisher: item.publisher,
          subject: item.subject,
          target_grade: item.target_grades.join("、"),
          student_quantity: parseInt(item.student_quantity || "0", 10),
          teacher_quantity: parseInt(item.teacher_quantity || "0", 10),
          main_item_type: item.main_item_type,
          answer_type: item.answer_type,
          answer_attached: item.answer_type !== "なし" ? item.answer_attached : null,
          accessory_type: item.accessory_type,
          accessory_attached: item.accessory_type !== "なし" ? item.accessory_attached : null,
          delivery_method: item.delivery_method,
          billing_target: item.delivery_method === "納品" ? item.billing_target : null,
          requested_date: item.delivery_method === "販売" && item.requested_date ? item.requested_date : null,
          remarks: item.remarks,
          unit_price: item.unit_price ? parseInt(item.unit_price, 10) : null,
          accounting_vendor: item.accounting_vendor
        }));

        const { error: itemsError } = await supabase.from('textbook_order_items').insert(itemsToSave);
        if (itemsError) throw itemsError;

        alert("注文を登録しました。");
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setOrderItems([...orderItems, { ...orderItems[0], textbook_name: "", publisher: "", subject: "", target_grades: [], student_quantity: "", teacher_quantity: "", unit_price: "", remarks: "" }]);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ backgroundColor: "white", width: "100%", maxWidth: "900px", maxHeight: "90vh", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "20px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: "#000" }}>注文を入力</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "30px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: "25px", padding: "15px", backgroundColor: "#f1f5f9", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "8px", color: "#1e293b" }}>注文年月日</label>
            <input 
              required 
              type="date" 
              value={commonInfo.order_date} 
              onChange={(e) => setCommonInfo({ ...commonInfo, order_date: e.target.value })} 
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000", fontSize: "1rem" }} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", color: "#000" }}>地区</label>
              <select required value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                <option value="">地区を選択</option>
                <option value="nagasaki">長崎地区</option>
                <option value="isahaya">諫早地区</option>
                <option value="omura">大村地区</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", color: "#000" }}>学校名</label>
              <select required value={commonInfo.school_name} onChange={(e) => setCommonInfo({ ...commonInfo, school_name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                <option value="">学校を選択</option>
                {selectedArea && schoolData[selectedArea].map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", color: "#000" }}>担当先生名</label>
              <input required type="text" value={commonInfo.teacher_name} onChange={(e) => setCommonInfo({ ...commonInfo, teacher_name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", color: "#000" }}>学校電話番号</label>
              <input type="text" value={commonInfo.school_phone} onChange={(e) => setCommonInfo({ ...commonInfo, school_phone: e.target.value })} placeholder="例: 095-xxx-xxxx" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", borderLeft: "4px solid #1e293b", paddingLeft: "10px", marginBottom: "20px", color: "#000" }}>教材内容</h3>
          {orderItems.map((item, idx) => (
            <div key={idx} style={{ padding: "20px", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "20px", backgroundColor: "#f8fafc" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>教材名</label>
                  <input required type="text" value={item.textbook_name} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].textbook_name = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>出版社</label>
                  <input required type="text" value={item.publisher} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].publisher = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>教科</label>
                  <input type="text" value={item.subject} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].subject = e.target.value;
                    setOrderItems(next);
                  }} placeholder="例: 数学" style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>帳合</label>
                  <input type="text" value={item.accounting_vendor} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].accounting_vendor = e.target.value;
                    setOrderItems(next);
                  }} placeholder="例: くさの書店" style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>本体価格</label>
                  <input type="number" value={item.unit_price} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].unit_price = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>本体</label>
                  <select value={item.main_item_type} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].main_item_type = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="冊子">冊子</option>
                    <option value="バラ">バラ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", marginBottom: "15px", backgroundColor: "rgba(255,255,255,0.4)", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>解答</label>
                  <select value={item.answer_type} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].answer_type = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="なし">なし</option>
                    <option value="冊子">冊子</option>
                    <option value="バラ">バラ</option>
                  </select>
                </div>
                {item.answer_type !== "なし" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>解答の添付</label>
                    <select value={item.answer_attached} onChange={(e) => {
                      const next = [...orderItems];
                      next[idx].answer_attached = e.target.value;
                      setOrderItems(next);
                    }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                      <option value="つける">つける</option>
                      <option value="はずす">はずす</option>
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>付属品</label>
                  <select value={item.accessory_type} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].accessory_type = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="なし">なし</option>
                    <option value="冊子">冊子</option>
                    <option value="バラ">バラ</option>
                  </select>
                </div>
                {item.accessory_type !== "なし" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>付属品添付</label>
                    <select value={item.accessory_attached} onChange={(e) => {
                      const next = [...orderItems];
                      next[idx].accessory_attached = e.target.value;
                      setOrderItems(next);
                    }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                      <option value="つける">つける</option>
                      <option value="はずす">はずす</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div style={{ gridColumn: "span 1" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px" }}>学年</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["1年", "2年", "3年"].map(g => (
                      <label key={g} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "2px", color: "#000" }}>
                        <input type="checkbox" checked={item.target_grades.includes(g)} onChange={() => {
                          const next = [...orderItems];
                          if (next[idx].target_grades.includes(g)) next[idx].target_grades = next[idx].target_grades.filter((v: string) => v !== g);
                          else next[idx].target_grades = [...next[idx].target_grades, g].sort();
                          setOrderItems(next);
                        }} /> {g}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>生徒数</label>
                  <input required type="number" value={item.student_quantity} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].student_quantity = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>教員数</label>
                  <input required type="number" value={item.teacher_quantity} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].teacher_quantity = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>形態</label>
                  <select value={item.delivery_method} onChange={(e) => {
                    const next = [...orderItems];
                    next[idx].delivery_method = e.target.value;
                    setOrderItems(next);
                  }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="納品">納品</option>
                    <option value="販売">販売</option>
                  </select>
                </div>
                <div>
                  {item.delivery_method === "納品" ? (
                    <>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>請求先</label>
                      <select value={item.billing_target} onChange={(e) => {
                        const next = [...orderItems];
                        next[idx].billing_target = e.target.value;
                        setOrderItems(next);
                      }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                        <option value="学校">学校</option>
                        <option value="個人">個人</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>販売希望日</label>
                      <input type="date" value={item.requested_date} onChange={(e) => {
                        const next = [...orderItems];
                        next[idx].requested_date = e.target.value;
                        setOrderItems(next);
                      }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px", backgroundColor: "white", color: "#000" }} />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>備考</label>
                <textarea value={item.remarks} onChange={(e) => {
                  const next = [...orderItems];
                  next[idx].remarks = e.target.value;
                  setOrderItems(next);
                }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "white", color: "#000" }} />
              </div>
              {orderItems.length > 1 && (
                <button type="button" onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))} style={{ color: "red", border: "none", background: "none", fontSize: "12px", marginTop: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Trash2 size={14} /> この教材を削除</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} style={{ width: "100%", padding: "10px", backgroundColor: "white", border: "2px dashed #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: "#64748b", marginBottom: "30px" }}>+ 教材を追加</button>

          <div style={{ display: "flex", gap: "15px" }}>
            <button type="submit" disabled={isSubmitting} style={{ flex: 1, backgroundColor: "#1e293b", color: "white", border: "none", padding: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "注文を登録する"}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1", padding: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TextbookAdminPage() {
  return <TextbookAdminContent />;
}
