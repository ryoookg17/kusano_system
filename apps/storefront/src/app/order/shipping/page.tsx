"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { shippingTargetSchools } from "@shared/schools";

// 現在対応している学校リスト
const targetSchools = shippingTargetSchools;

function ShippingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初回読み込み時にURLパラメータから学校名をセット
  useEffect(() => {
    const schoolParam = searchParams.get("school");
    if (schoolParam && targetSchools.includes(schoolParam)) {
      setSelectedSchool(schoolParam);
    }
  }, [searchParams]);

  // フォームデータ
  const [formData, setFormData] = useState({
    grade: "",
    course: "", // 学科(コース)
    student_name: "",
    email: "",
    phone: "",
    zipcode: "",
    address: "",
    remarks: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 郵便番号からAPI経由で住所を自動取得する機能
  const handleZipSearch = async () => {
    const cleanZip = formData.zipcode.replace(/-/g, "").trim();
    if (!cleanZip) {
      alert("郵便番号を入力してください。");
      return;
    }
    
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanZip}`);
      const data = await res.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const addr = data.results[0];
        // 都道府県 + 市区町村 + 町域 を結合
        const fullAddr = `${addr.address1}${addr.address2}${addr.address3}`;
        setFormData({ ...formData, address: fullAddr });
      } else {
        alert("該当する住所データが見つかりませんでした。手作業で入力してください。");
      }
    } catch (error) {
      console.error(error);
      alert("住所検索に関する通信エラーが発生しました。手作業で入力してください。");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const id = crypto.randomUUID();

      const { error } = await supabase
        .from('shipping_requests')
        .insert([{
          id: id,
          school_name: selectedSchool,
          grade: formData.grade,
          course: formData.course || null,
          student_name: formData.student_name,
          email: formData.email,
          phone: formData.phone,
          zipcode: formData.zipcode,
          address: formData.address,
          remarks: formData.remarks || null
        }]);
        
      if (error) throw error;

      // 注文確認メールの送信
      try {
        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.email,
            subject: `【くさの書店】郵送依頼を承りました（ID: ${id.slice(0, 8)}）`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 10px;">ご注文ありがとうございます</h2>
                <p>${formData.student_name} 様</p>
                <p>この度は、くさの書店への郵送依頼をいただき、誠にありがとうございます。<br>以下の内容で承りましたので、内容をご確認ください。</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 5px 0;"><strong>受付ID:</strong> ${id}</p>
                  <p style="margin: 5px 0;"><strong>学校名:</strong> ${selectedSchool}</p>
                  <p style="margin: 5px 0;"><strong>学年・学科:</strong> ${formData.grade} ${formData.course || ''}</p>
                  <p style="margin: 15px 0 5px 0;"><strong>お届け先:</strong></p>
                  <p style="margin: 0; padding-left: 10px; border-left: 3px solid #cbd5e1;">
                    〒${formData.zipcode}<br>
                    ${formData.address}
                  </p>
                  ${formData.remarks ? `<p style="margin: 15px 0 5px 0;"><strong>備考:</strong><br>${formData.remarks}</p>` : ''}
                </div>

                <p style="font-size: 0.9rem; color: #64748b;">※本メールはシステムによる自動送信です。心当たりがない場合はお手数ですが破棄してください。</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="font-weight: bold; margin-bottom: 5px;">くさの書店</p>
                  <p style="font-size: 0.85rem; margin: 0;">ホームページ: <a href="https://kusano-bookstore.jp">https://kusano-bookstore.jp</a></p>
                </div>
              </div>
            `,
            text: `${formData.student_name} 様\n\nくさの書店への郵送依頼をありがとうございます。\n以下の内容で承りました。\n\n受付ID: ${id}\n学校名: ${selectedSchool}\n学年・学科: ${formData.grade} ${formData.course || ''}\nお届け先: 〒${formData.zipcode} ${formData.address}\n\n発送まで今しばらくお待ちください。`
          }),
        });
      } catch (mailErr) {
        console.error("Failed to send confirmation email:", mailErr);
        // メール送信に失敗しても、注文自体は完了しているのでアラートは出さない（またはログのみ）
      }

      alert("郵送依頼の送信が完了しました！");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("サーバー通信エラーが発生しました。データベースの構築状況をご確認ください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ステップ1：学校の選択画面
  if (!selectedSchool) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <h1 className="section-heading" style={{ borderBottom: "2px solid var(--kusano-accent-navy)", color: "var(--kusano-accent-navy)", width: "100%", paddingBottom: "10px", marginBottom: "40px" }}>
          郵送依頼
        </h1>
        <p style={{ textAlign: "center", marginBottom: "30px", fontSize: "1.1rem" }}>
          郵送を依頼する学校を選択してください。
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          {targetSchools.map(school => (
            <button
              key={school}
              onClick={() => setSelectedSchool(school)}
              style={{
                padding: "30px 20px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "var(--kusano-accent-navy)",
                border: "2px solid var(--kusano-accent-navy)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--kusano-accent-navy)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = "var(--kusano-accent-navy)";
                e.currentTarget.style.transform = "none";
              }}
            >
              {school}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ステップ2：入力フォーム画面
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--kusano-accent-navy)", paddingBottom: "10px", marginBottom: "30px" }}>
        <h1 className="section-heading" style={{ color: "var(--kusano-accent-navy)", margin: 0, padding: 0, border: "none" }}>
          {selectedSchool} 郵送依頼フォーム
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px", backgroundColor: "#fff", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 150px" }}>
            <label style={{ fontWeight: "bold" }}>学年 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
            <input required name="grade" value={formData.grade} onChange={handleChange} placeholder="例: 1年" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "2 1 200px" }}>
            <label style={{ fontWeight: "bold" }}>学科・コース</label>
            <input name="course" value={formData.course} onChange={handleChange} placeholder="例: 理数科（※ない場合は空欄）" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontWeight: "bold" }}>生徒ご氏名 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
          <input required name="student_name" value={formData.student_name} onChange={handleChange} placeholder="" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontWeight: "bold" }}>メールアドレス <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="例: student@example.com" />
        </div>


        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontWeight: "bold" }}>電話番号 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
          <input required name="phone" value={formData.phone} onChange={handleChange} placeholder="例: 090xxxxxxxx" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px", padding: "20px", backgroundColor: "#fdfdfd", border: "1px solid #eee", borderRadius: "6px" }}>
          <label style={{ fontWeight: "bold", borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>お届け先情報</label>
          
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1" }}>
              <label style={{ fontSize: "14px" }}>郵便番号 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
              <input required name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="例: 8500853" />
            </div>
            <button 
              type="button" 
              onClick={handleZipSearch}
              style={{ padding: "10px 15px", height: "42px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              住所を自動入力
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
            <label style={{ fontSize: "14px" }}>ご住所 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
            <input required name="address" value={formData.address} onChange={handleChange} placeholder="自動入力後、番地・建物名・部屋番号を書き足してください" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontWeight: "bold" }}>備考（ご要望など）</label>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} placeholder="配達に関して特別な希望があればご記入ください" />
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary" 
            style={{ fontSize: "1.2rem", padding: "15px 50px", backgroundColor: isSubmitting ? "#ccc" : "var(--kusano-accent-navy)", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
          >
            {isSubmitting ? "送信中..." : "依頼を確定する"}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function ShippingRequestPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "50px" }}>読み込み中...</div>}>
      <ShippingContent />
    </Suspense>
  );
}
