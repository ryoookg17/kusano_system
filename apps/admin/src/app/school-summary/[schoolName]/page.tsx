"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { shippingTargetSchools } from "@shared/schools";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, BookOpen, Library, Truck, Check, Edit2, X, Search, FileSpreadsheet, CheckSquare } from "lucide-react";
import { OrderEntryModal } from "@/app/textbook/page";

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
  const [selectedYear, setSelectedYear] = useState("all"); 
  const [filterKeyword, setFilterKeyword] = useState("");
  
  // モーダル編集用のステート
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // 出力用モーダルのステート
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportYearMonth, setExportYearMonth] = useState("");
  const [exportSubject, setExportSubject] = useState("");
  const [exportGrade, setExportGrade] = useState("");

  // 補助教材のリスト（まとめずに個別の注文として表示）
  const aggregatedTextbooks = React.useMemo(() => {
    const list: any[] = [];
    
    data.textbooks.forEach(order => {
      if (selectedYear !== "all") {
        const orderYear = new Date(order.created_at).getFullYear().toString();
        if (orderYear !== selectedYear) return;
      }

      order.items?.forEach((item: any) => {
        if (filterKeyword) {
          const k = filterKeyword.toLowerCase();
          const s = order.school_name?.toLowerCase() || "";
          const t = item.textbook_name?.toLowerCase() || "";
          const p = item.publisher?.toLowerCase() || "";
          if (!s.includes(k) && !t.includes(k) && !p.includes(k)) return;
        }

        const priceTaxIncl = Math.floor((item.unit_price || 0) * 1.1);
        const totalQty = item.student_quantity || 0;

        list.push({
          ...item,
          key: item.id,
          textbook_name: item.textbook_name,
          publisher: item.publisher,
          student_quantity: item.student_quantity || 0,
          teacher_quantity: item.teacher_quantity || 0,
          unit_price: item.unit_price || 0,
          subject: item.subject || "",
          latest_order_date: order.created_at,
          all_items: [{ ...item, order_id: order.id }], // 編集機能との互換性維持
          price_tax_incl: priceTaxIncl,
          total_amount: priceTaxIncl * totalQty,
          teacher_names: order.teacher_name || ""
        });
      });
    });
    
    return list.sort((a, b) => {
      return new Date(b.latest_order_date).getTime() - new Date(a.latest_order_date).getTime();
    });
  }, [data.textbooks, selectedYear]);

  const yearlyStats = React.useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    
    data.textbooks.forEach(order => {
      const year = new Date(order.created_at).getFullYear().toString();
      if (!stats[year]) stats[year] = { total: 0, count: 0 };
      order.items?.forEach((item: any) => {
        const priceTaxIncl = Math.floor((item.unit_price || 0) * 1.1);
        const qty = item.student_quantity || 0;
        stats[year].total += priceTaxIncl * qty;
        stats[year].count += qty;
      });
    });

    data.schoolbooks.forEach(order => {
      const year = new Date(order.created_at).getFullYear().toString();
      if (!stats[year]) stats[year] = { total: 0, count: 0 };
      order.items?.forEach((item: any) => {
        const priceTaxIncl = Math.floor((item.price_excluding_tax || 0) * 1.1);
        const qty = parseInt(item.quantity || "0");
        stats[year].total += priceTaxIncl * qty;
        stats[year].count += qty;
      });
    });

    return Object.entries(stats)
      .map(([year, val]) => ({ year, ...val }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [data]);

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
    // 最初のアイテムをベースにする
    const firstItem = item.all_items[0];
    const parentOrder = data.textbooks.find(o => o.id === firstItem.order_id);
    
    if (!parentOrder) {
      alert("元の注文データが見つかりません。");
      return;
    }

    // OrderEntryModal が期待する形式にする
    setEditingItem({
      ...firstItem,
      order: parentOrder
    });
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
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>{schoolName}</h1>
          <p style={{ color: "#334155", fontWeight: "bold", marginTop: "5px" }}>全カテゴリの注文・依頼まとめ</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {/* 分析セクション */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", borderBottom: "3px solid #8b5cf6", paddingBottom: "10px" }}>
            <Search size={24} color="#8b5cf6" />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>分析</h2>
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #cbd5e1", color: "#1e293b", fontSize: "0.9rem" }}>
                  <th style={{ padding: "12px 10px" }}>年</th>
                  <th style={{ padding: "12px 10px" }}>売上合計 (税込)</th>
                  <th style={{ padding: "12px 10px" }}>前年比</th>
                </tr>
              </thead>
              <tbody>
                {yearlyStats.filter(s => parseInt(s.year) >= 2020).map((stat) => {
                  const prevYearStat = yearlyStats.find(s => parseInt(s.year) === parseInt(stat.year) - 1);
                  const yoy = prevYearStat && prevYearStat.total > 0 ? ((stat.total / prevYearStat.total) * 100).toFixed(1) : null;
                  
                  return (
                    <tr key={stat.year} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "white" }}>
                      <td style={{ padding: "12px 10px", fontWeight: "bold", color: "#475569" }}>{stat.year}年</td>
                      <td style={{ padding: "12px 10px", fontWeight: "bold", color: "#1d4ed8", fontSize: "1.1rem" }}>¥{stat.total.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px", fontWeight: "bold", color: yoy && Number(yoy) >= 100 ? "#16a34a" : (yoy ? "#dc2626" : "#94a3b8") }}>
                        {yoy ? `${yoy}% ${Number(yoy) >= 100 ? "↑" : "↓"}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 補助教材セクション */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", borderBottom: "3px solid #3b82f6", paddingBottom: "10px" }}>
            <BookOpen size={24} color="#3b82f6" />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>補助教材のご注文</h2>
            <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "900" }}>{aggregatedTextbooks.length}種類</span>
          </div>

          <div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", fontSize: "0.9rem", color: "#000", cursor: "pointer" }}
              >
                <option value="all">すべての年</option>
                {[...new Set(yearlyStats.map(s => s.year))].sort().reverse().map(y => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="学校名・教材名・出版社で検索..."
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "350px", fontSize: "0.9rem", backgroundColor: "white", color: "#000" }}
              />
            </div>
            
            <button
              onClick={() => setIsExportModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", color: "#000", border: "1.5px solid #000", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
            >
              <FileSpreadsheet size={18} /> 教材注文書出力
            </button>
          </div>

          {aggregatedTextbooks.length === 0 ? <p style={{ color: "#475569", padding: "10px" }}>注文データはありません</p> : (
            <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", color: "#1e293b", fontSize: "0.85rem" }}>
                    <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>注文日</th>
                    <th style={{ padding: "12px 10px" }}>教材名</th>
                    <th style={{ padding: "12px 10px", width: "120px" }}>出版社</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "100px" }}>本体価格</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "100px" }}>税込価格</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "100px" }}>冊数</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", width: "120px" }}>合計金額</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", width: "100px" }}>教科</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", width: "80px" }}>学年</th>
                    <th style={{ padding: "12px 10px", width: "150px" }}>担当先生</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedTextbooks.map((item, idx) => {
                    return (
                      <tr key={item.key} style={{ borderBottom: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: "white" }}>
                        <td style={{ padding: "12px 10px", color: "#475569", whiteSpace: "nowrap" }}>
                          {new Date(item.latest_order_date).toLocaleDateString('ja-JP')}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <div 
                            style={{ fontWeight: "bold", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => startEditing(item)}
                          >
                            {item.textbook_name}
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px", color: "#64748b", fontSize: "0.85rem" }}>
                          {item.publisher}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", color: "#64748b" }}>
                          ¥{item.unit_price.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", color: "#0f172a" }}>
                          ¥{item.price_tax_incl.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", color: "#0f172a" }}>
                          {item.student_quantity.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "900", color: "#1d4ed8" }}>
                          ¥{item.total_amount.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          <span style={{ backgroundColor: item.subject ? "#f1f5f9" : "#fee2e2", padding: "2px 6px", borderRadius: "3px", fontSize: "0.75rem", color: item.subject ? "#475569" : "#ef4444", fontWeight: "bold", whiteSpace: "nowrap" }}>
                            {item.subject || "未設定"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center", whiteSpace: "nowrap", color: "#000" }}>
                          {item.target_grade ? `${item.target_grade}${item.target_grade.toString().includes('年') ? '' : '年'}` : "-"}
                        </td>
                        <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "#1e293b" }}>
                          {item.teacher_names}
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

      {editingItem && (
        <OrderEntryModal 
          initialItem={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSuccess={() => {
            setEditingItem(null);
            fetchSchoolData();
          }} 
        />
      )}

      {isExportModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "10px", width: "400px", maxWidth: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#0f172a" }}>教材注文書出力</h2>
              <button onClick={() => setIsExportModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "bold", color: "#475569", marginBottom: "5px" }}>年月</label>
                <input 
                  type="month" 
                  value={exportYearMonth} 
                  onChange={(e) => setExportYearMonth(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#000", backgroundColor: "white", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "bold", color: "#475569", marginBottom: "5px" }}>教科</label>
                <select 
                  value={exportSubject} 
                  onChange={(e) => setExportSubject(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#000", backgroundColor: "white", boxSizing: "border-box" }}
                >
                  <option value="">すべて</option>
                  {[...new Set(aggregatedTextbooks.map(i => i.subject).filter(Boolean))].sort().map(s => (
                    <option key={s as string} value={s as string}>{s as string}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "bold", color: "#475569", marginBottom: "5px" }}>学年</label>
                <select 
                  value={exportGrade} 
                  onChange={(e) => setExportGrade(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#000", backgroundColor: "white", boxSizing: "border-box" }}
                >
                  <option value="">すべて</option>
                  {[...new Set(aggregatedTextbooks.map(i => i.target_grade).filter(Boolean))].sort().map(g => (
                    <option key={g as string} value={g as string}>{g as string}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={() => {
                  if (!exportYearMonth) return alert("年月を選択してください。");
                  window.location.href = `/api/textbook-sales-excel?schoolName=${encodeURIComponent(schoolName)}&yearMonth=${exportYearMonth}&subject=${encodeURIComponent(exportSubject)}&grade=${encodeURIComponent(exportGrade)}`;
                  setIsExportModalOpen(false);
                }}
                style={{ marginTop: "10px", padding: "12px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
              >
                出力する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
