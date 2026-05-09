"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { shippingTargetSchools } from "@shared/schools";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, BookOpen, Library, Truck, Check, Edit2, X } from "lucide-react";

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolName = decodeURIComponent(params.schoolName as string);

  const [data, setData] = useState({
    textbooks: [] as any[],
    schoolbooks: [] as any[],
    shippings: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  
  // インライン編集用のステート
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, subject: "" });
  const [saving, setSaving] = useState(false);

  // 補助教材の集計ロジック（教材マスタ非依存）
  const aggregatedTextbooks = React.useMemo(() => {
    const map = new Map();
    
    data.textbooks.forEach(order => {
      order.items?.forEach((item: any) => {
        const key = `${item.textbook_name}_${item.publisher}`;
        const existing = map.get(key) || {
          key,
          textbook_name: item.textbook_name,
          publisher: item.publisher,
          student_quantity: 0,
          teacher_quantity: 0,
          teachers: new Set(),
          unit_price: item.unit_price || 0, // マスタ非依存
          subject: item.subject || "", // マスタ非依存
          latest_order_date: order.created_at,
          all_items: []
        };
        
        existing.student_quantity += (item.student_quantity || 0);
        existing.teacher_quantity += (item.teacher_quantity || 0);
        existing.teachers.add(order.teacher_name);
        existing.all_items.push({ ...item, teacher_name: order.teacher_name });
        
        // 最新の注文日を保持
        if (new Date(order.created_at) > new Date(existing.latest_order_date)) {
          existing.latest_order_date = order.created_at;
        }

        // 価格や教科が後のアイテムで設定されていれば上書き（簡易的な同期）
        if (item.unit_price) existing.unit_price = item.unit_price;
        if (item.subject) existing.subject = item.subject;

        map.set(key, existing);
      });
    });
    
    return Array.from(map.values()).map(item => {
      const priceTaxIncl = Math.floor(item.unit_price * 1.1);
      const totalQty = item.student_quantity + item.teacher_quantity;
      
      return {
        ...item,
        price_tax_incl: priceTaxIncl,
        total_amount: priceTaxIncl * totalQty,
        teacher_names: Array.from(item.teachers).join(", ")
      };
    }).sort((a, b) => {
      return (a.subject || "未分類").localeCompare(b.subject || "未分類", 'ja');
    });
  }, [data.textbooks]);

  useEffect(() => {
    fetchSchoolData();
  }, [schoolName]);

  async function fetchSchoolData() {
    setLoading(true);
    try {
      const [
        { data: textbooks },
        { data: schoolbooks },
        { data: shippings }
      ] = await Promise.all([
        supabase.from('textbook_orders').select('*, items:textbook_order_items(*)').eq('school_name', schoolName).order('created_at', { ascending: false }),
        supabase.from('schoolbook_orders').select('*, items:schoolbook_order_items(*)').eq('school_name', schoolName).order('created_at', { ascending: false }),
        supabase.from('shipping_requests').select('*').eq('school_name', schoolName).order('created_at', { ascending: false })
      ]);

      setData({
        textbooks: textbooks || [],
        schoolbooks: schoolbooks || [],
        shippings: shippings || []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const startEditing = (item: any) => {
    setEditingKey(item.key);
    setEditForm({ price: item.unit_price || 0, subject: item.subject || "" });
  };

  const cancelEditing = () => {
    setEditingKey(null);
  };

  const saveInlineEdit = async (textbook_name: string, publisher: string) => {
    setSaving(true);
    try {
      // 該当学校のオーダーIDを取得
      const orderIds = data.textbooks.map(o => o.id);
      if (orderIds.length === 0) return;

      const { error } = await supabase.from('textbook_order_items')
        .update({ 
          unit_price: editForm.price, 
          subject: editForm.subject 
        })
        .eq('textbook_name', textbook_name)
        .eq('publisher', publisher)
        .in('order_id', orderIds);

      if (error) throw error;

      // リロードして反映
      await fetchSchoolData();
      setEditingKey(null);
    } catch (error: any) {
      console.error(error);
      alert("保存に失敗しました: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>読み込み中...</div>;

  return (
    <div style={{ maxWidth: "1200px" }}>
      <button 
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: "bold", marginBottom: "20px" }}
      >
        <ArrowLeft size={18} /> 学校一覧に戻る
      </button>

      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>{schoolName}</h1>
        <p style={{ color: "#334155", fontWeight: "bold", marginTop: "5px" }}>全カテゴリの注文・依頼まとめ</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* 補助教材セクション */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", borderBottom: "3px solid #3b82f6", paddingBottom: "10px" }}>
            <BookOpen size={24} color="#3b82f6" />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>補助教材のご注文</h2>
            <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "900" }}>{aggregatedTextbooks.length}種類</span>
          </div>

          {aggregatedTextbooks.length === 0 ? <p style={{ color: "#475569", padding: "10px" }}>注文データはありません</p> : (
            <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", color: "#1e293b", fontSize: "0.85rem" }}>
                    <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>注文年月日</th>
                    <th style={{ padding: "12px 10px" }}>教材名</th>
                    <th style={{ padding: "12px 10px", width: "120px" }}>出版社</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "100px" }}>本体価格</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "100px" }}>税込価格</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "100px" }}>合計冊数</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "120px" }}>合計金額</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", width: "100px" }}>教科</th>
                    <th style={{ padding: "12px 10px", width: "120px" }}>先生名</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", whiteSpace: "nowrap" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedTextbooks.map((item, idx) => {
                    const isEditing = editingKey === item.key;
                    return (
                      <tr key={item.key} style={{ borderBottom: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: isEditing ? "#fffbeb" : "white" }}>
                        <td style={{ padding: "12px 10px", color: "#475569", whiteSpace: "nowrap" }}>
                          {new Date(item.latest_order_date).toLocaleDateString('ja-JP')}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{item.textbook_name}</div>
                        </td>
                        <td style={{ padding: "12px 10px", color: "#64748b", fontSize: "0.85rem" }}>
                          {item.publisher}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", color: "#64748b" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                              ¥<input 
                                type="number" 
                                value={editForm.price} 
                                onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                                style={{ padding: "4px 8px", width: "80px", borderRadius: "4px", border: "1px solid #cbd5e1", textAlign: "right", marginLeft: "4px" }}
                              />
                            </div>
                          ) : (
                            <span>¥{item.unit_price.toLocaleString()}</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", color: "#0f172a" }}>
                          ¥{isEditing ? Math.floor(editForm.price * 1.1).toLocaleString() : item.price_tax_incl.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", color: "#0f172a" }}>
                          {(item.student_quantity + item.teacher_quantity).toLocaleString()}
                          <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "normal" }}>
                            (生{item.student_quantity} / 教{item.teacher_quantity})
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "900", color: "#1d4ed8" }}>
                          ¥{isEditing ? (Math.floor(editForm.price * 1.1) * (item.student_quantity + item.teacher_quantity)).toLocaleString() : item.total_amount.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editForm.subject} 
                              onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                              style={{ padding: "4px 8px", width: "80px", borderRadius: "4px", border: "1px solid #cbd5e1", textAlign: "center" }}
                              placeholder="教科"
                            />
                          ) : (
                            <span style={{ backgroundColor: item.subject ? "#f1f5f9" : "#fee2e2", padding: "2px 6px", borderRadius: "3px", fontSize: "0.75rem", color: item.subject ? "#475569" : "#ef4444", fontWeight: "bold", whiteSpace: "nowrap" }}>
                              {item.subject || "未設定"}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "#1e293b", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.teacher_names}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                              <button onClick={() => saveInlineEdit(item.textbook_name, item.publisher)} disabled={saving} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }} title="保存">
                                <Check size={16} />
                              </button>
                              <button onClick={cancelEditing} disabled={saving} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }} title="キャンセル">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEditing(item)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", backgroundColor: "white", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", margin: "0 auto" }}>
                              <Edit2 size={14} style={{ marginRight: "4px" }} /> 編集
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold", borderTop: "2px solid #e2e8f0" }}>
                    <td colSpan={6} style={{ padding: "15px", textAlign: "right", color: "#0f172a" }}>補助教材 総計 (税込)</td>
                    <td style={{ padding: "15px", textAlign: "right", fontSize: "1.1rem", color: "#1d4ed8" }}>
                      ¥{aggregatedTextbooks.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* 学校図書セクション */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", borderBottom: "3px solid #10b981", paddingBottom: "10px" }}>
            <Library size={24} color="#10b981" />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>学校図書のご注文</h2>
            <span style={{ backgroundColor: "#ecfdf5", color: "#059669", padding: "2px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "900" }}>{data.schoolbooks.length}件</span>
          </div>
          {data.schoolbooks.length === 0 ? <p style={{ color: "#475569", padding: "10px" }}>注文履歴はありません</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.schoolbooks.map(o => (
                <Link key={o.id} href={`/schoolbook?id=${o.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", cursor: "pointer", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#f8fafc"} onMouseOut={e => e.currentTarget.style.backgroundColor = "#fff"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "bold" }}>{new Date(o.created_at).toLocaleString('ja-JP')}</div>
                        <div style={{ fontWeight: "bold", color: "#0f172a" }}>担当: {o.teacher_name} 先生</div>
                      </div>
                      <div style={{ 
                        padding: "4px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "0.85rem",
                        backgroundColor: o.status === "完了" ? "#dcfce3" : "#fef3c7",
                        color: o.status === "完了" ? "#16a34a" : "#b45309"
                      }}>
                        {o.status}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: "bold" }}>
                      {o.items?.slice(0, 2).map((item: any) => item.book_title).join(", ")}
                      {o.items?.length > 2 && " ...ほか"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 郵送依頼セクション */}
        {shippingTargetSchools.includes(schoolName) && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", borderBottom: "3px solid #f59e0b", paddingBottom: "10px" }}>
              <Truck size={24} color="#f59e0b" />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>生徒の郵送依頼</h2>
              <span style={{ backgroundColor: "#fffbeb", color: "#b45309", padding: "2px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "900" }}>{data.shippings.length}件</span>
            </div>
            {data.shippings.length === 0 ? <p style={{ color: "#475569", padding: "10px" }}>依頼履歴はありません</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.shippings.map(s => (
                  <Link key={s.id} href={`/shipping?id=${s.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#f8fafc"} onMouseOut={e => e.currentTarget.style.backgroundColor = "#fff"}>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#334155", marginBottom: "4px", fontWeight: "bold" }}>{new Date(s.created_at).toLocaleString('ja-JP')}</div>
                        <div style={{ fontWeight: "bold", color: "#0f172a" }}>{s.student_name} 様 <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: "bold" }}>({s.grade} {s.course})</span></div>
                        <div style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: "bold" }}>{s.address}</div>
                      </div>
                      <div style={{ 
                        padding: "4px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "0.85rem",
                        backgroundColor: s.status === "完了" ? "#dcfce3" : "#fef3c7",
                        color: s.status === "完了" ? "#16a34a" : "#b45309"
                      }}>
                        {s.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
