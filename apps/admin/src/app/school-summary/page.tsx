"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import SectionGuard from "@/components/SectionGuard";


import { getSchoolCategory, AREA_MAP, TYPE_MAP } from "@/lib/schoolList";

interface SchoolSummary {
  name: string;
  school_type: string;
  school_area: string;
  textbook_pending: number;
  textbook_total: number;
  schoolbook_pending: number;
  schoolbook_total: number;
  shipping_pending: number;
  shipping_total: number;
  total_pending: number;
}

const ModuleStatus = ({ label, pending, total }: { label: string, pending: number, total: number }) => {
  let statusText = "注文なし";
  let bgColor = "#f1f5f9";
  let color = "#94a3b8";

  if (total > 0) {
    statusText = `${total}件`;
    bgColor = "#eff6ff";
    color = "#1d4ed8";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 5px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "bold", marginBottom: "6px" }}>{label}</div>
      <div style={{ backgroundColor: bgColor, color: color, padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>
        {statusText}
      </div>
    </div>
  );
};

export default function SchoolSummaryPage() {
  return (
    <SectionGuard sectionId="summary" sectionName="学校別管理">
      <SchoolSummaryContent />
    </SectionGuard>
  );
}

function SchoolSummaryContent() {

  const [summaries, setSummaries] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchSummaries();
  }, []);

  async function fetchSummaries() {
    setLoading(true);
    try {
      const [
        { data: textbooks },
        { data: schoolbooks },
        { data: shippings }
      ] = await Promise.all([
        supabase.from('textbook_orders').select('school_name, status'),
        supabase.from('schoolbook_orders').select('school_name, status'),
        supabase.from('shipping_requests').select('school_name, status')
      ]);

      const schoolMap: Record<string, SchoolSummary> = {};

      const initializeSchool = (name: string) => {
        if (!name) return;
        if (!schoolMap[name]) {
          const { type, area } = getSchoolCategory(name);
          schoolMap[name] = {
            name,
            school_type: type,
            school_area: area,
            textbook_pending: 0, textbook_total: 0,
            schoolbook_pending: 0, schoolbook_total: 0,
            shipping_pending: 0, shipping_total: 0,
            total_pending: 0
          };
        }
      };

      schoolbooks?.forEach(o => {
        initializeSchool(o.school_name);
        schoolMap[o.school_name].schoolbook_total++;
        if (o.status !== '完了') schoolMap[o.school_name].schoolbook_pending++;
      });

      textbooks?.forEach(o => {
        initializeSchool(o.school_name);
        schoolMap[o.school_name].textbook_total++;
        if (o.status !== '完了') schoolMap[o.school_name].textbook_pending++;
      });

      shippings?.forEach(o => {
        initializeSchool(o.school_name);
        schoolMap[o.school_name].shipping_total++;
        if (o.status !== '完了') schoolMap[o.school_name].shipping_pending++;
      });

      const result = Object.values(schoolMap).map(s => ({
        ...s,
        total_pending: s.textbook_pending + s.schoolbook_pending + s.shipping_pending
      }));

      setSummaries(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSummaries = summaries.filter(s => {
    const areaMatch = !selectedArea || s.school_area === selectedArea;
    const typeMatch = !selectedType || s.school_type === selectedType;
    return areaMatch && typeMatch;
  });

  const typeOrder = ["小学校", "中学校", "高校", "特別支援", "未分類"];
  const areaOrder = ["長崎市", "諫早市", "大村市", "西彼杵郡", "特別支援（地域なし）", "未分類"];

  const getActiveAreas = () => {
    const areas = Array.from(new Set(filteredSummaries.map(s => s.school_area)));
    return areaOrder.filter(a => areas.includes(a));
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>学校別 管理</h1>
      </div>

      <div style={{ marginBottom: "30px", backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>市区で絞り込む：</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={() => setSelectedArea(null)} style={{ padding: "6px 15px", borderRadius: "20px", border: "1px solid #cbd5e1", fontSize: "0.85rem", cursor: "pointer", backgroundColor: selectedArea === null ? "#334155" : "white", color: selectedArea === null ? "white" : "#334155", fontWeight: "bold" }}>すべて</button>
            {Object.values(AREA_MAP).map(area => (
              <button key={area} onClick={() => setSelectedArea(area)} style={{ padding: "6px 15px", borderRadius: "20px", border: "1px solid #cbd5e1", fontSize: "0.85rem", cursor: "pointer", backgroundColor: selectedArea === area ? "#3b82f6" : "white", color: selectedArea === area ? "white" : "#334155", fontWeight: "bold" }}>{area}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>校種で絞り込む：</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={() => setSelectedType(null)} style={{ padding: "6px 15px", borderRadius: "20px", border: "1px solid #cbd5e1", fontSize: "0.85rem", cursor: "pointer", backgroundColor: selectedType === null ? "#334155" : "white", color: selectedType === null ? "white" : "#334155", fontWeight: "bold" }}>すべて</button>
            {Object.values(TYPE_MAP).map(type => (
              <button key={type} onClick={() => setSelectedType(type)} style={{ padding: "6px 15px", borderRadius: "20px", border: "1px solid #cbd5e1", fontSize: "0.85rem", cursor: "pointer", backgroundColor: selectedType === type ? "#10b981" : "white", color: selectedType === type ? "white" : "#334155", fontWeight: "bold" }}>{type}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>集計中...</div>
      ) : filteredSummaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", backgroundColor: "#fff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>該当する注文データがありません。</div>
      ) : (
        <div>
          {getActiveAreas().map(area => {
            const areaSchools = filteredSummaries.filter(s => s.school_area === area);
            return (
              <div key={area} style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "1.5rem", borderBottom: "3px solid #334155", paddingBottom: "8px", marginBottom: "20px", color: "#0f172a" }}>📍 {area}</h2>
                {typeOrder.map(type => {
                  const typeSchools = areaSchools.filter(s => s.school_type === type);
                  if (typeSchools.length === 0) return null;
                  
                  return (
                    <div key={type} style={{ marginBottom: "25px", paddingLeft: "10px" }}>
                      <h3 style={{ fontSize: "1.1rem", color: "#475569", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}><BookOpen size={18} /> {type}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginBottom: "15px" }}>
                        {typeSchools.map(summary => (
                          <Link key={summary.name} href={`/school-summary/${encodeURIComponent(summary.name)}`} style={{ textDecoration: "none" }}>
                            <div style={{ backgroundColor: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", transition: "all 0.2s", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "none"}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "1.1rem" }}>{summary.name}</div>
                                <ChevronRight size={18} color="#cbd5e1" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
