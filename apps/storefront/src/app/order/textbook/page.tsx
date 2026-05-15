"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { allSchoolData as schoolList, schoolTypeLabels, areaLabels } from "@shared/schools";
import * as XLSX from "xlsx";

export default function TextbookOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // 注文の共通情報
  const [commonInfo, setCommonInfo] = useState({
    school_type: "",
    school_area: "",
    school_name: "",
    teacher_name: "",
    school_phone: "",
    personal_phone: "", // 任意
  });

  // 教材ごとの情報（Target Gradeを配列に変更）
  const [items, setItems] = useState([
    {
      textbook_name: "",
      publisher: "",
      subject: "",
      target_grades: [] as string[], // 複数選択のために配列化
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
      unit_price: "", // 追加
    },
  ]);

  const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCommonInfo({ ...commonInfo, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCommonInfo({
      ...commonInfo,
      school_type: e.target.value,
      school_area: "",
      school_name: "",
    });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCommonInfo({
      ...commonInfo,
      school_area: e.target.value,
      school_name: "",
    });
  };

  // 紐づく学校のリストを取得
  let availableSchools: string[] = [];
  if (commonInfo.school_type === "special") {
    availableSchools = schoolList["special"];
  } else if (commonInfo.school_type && commonInfo.school_area) {
    availableSchools = schoolList[commonInfo.school_type]?.[commonInfo.school_area] || [];
  }

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (typeof value === 'string' && ['unit_price', 'student_quantity', 'teacher_quantity'].includes(name)) {
      value = value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, '');
    }
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [name]: value };
    setItems(newItems);
  };

  // 学年チェックボックスのハンドラー
  const handleGradeCheck = (index: number, grade: string) => {
    const newItems = [...items];
    const currentGrades = newItems[index].target_grades;
    
    if (currentGrades.includes(grade)) {
      // 既に選択されていれば外す
      newItems[index].target_grades = currentGrades.filter(g => g !== grade);
    } else {
      // 選択されていなければ追加する（並び替えのために1,2,3でソート）
      newItems[index].target_grades = [...currentGrades, grade].sort();
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        textbook_name: "",
        publisher: "",
        subject: "",
        target_grades: [],
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
        unit_price: "", // 追加
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheetData = items.map((item, index) => ({
      "No.": index + 1,
      "教材名": item.textbook_name,
      "出版社": item.publisher,
      "教科": item.subject || "-",
      "学年": item.target_grades.join("、"),
      "本体価格": item.unit_price,
      "生徒用冊数": item.student_quantity,
      "教員用冊数": item.teacher_quantity,
      "形態": item.main_item_type,
      "解答": item.answer_type !== "なし" ? `${item.answer_type} (${item.answer_attached})` : "なし",
      "付属品": item.accessory_type !== "なし" ? `${item.accessory_type} (${item.accessory_attached})` : "なし",
      "納品/販売": item.delivery_method,
      "請求先": item.delivery_method === "納品" ? item.billing_target : "-",
      "販売日": item.delivery_method === "販売" ? item.requested_date : "-",
      "備考": item.remarks
    }));
    
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "ご注文内容");
    XLSX.writeFile(wb, `教材ご注文控え_${commonInfo.school_name}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.xlsx`);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirming(true);
    window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. 注文共通情報を textbook_orders テーブルに保存
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase
        .from('textbook_orders')
        .insert([{
          id: orderId,
          created_at: new Date().toLocaleDateString("sv-SE"),
          school_name: commonInfo.school_name,
          teacher_name: commonInfo.teacher_name,
          school_phone: commonInfo.school_phone,
          personal_phone: commonInfo.personal_phone
        }]);
        
      if (orderError) throw orderError;

      // 2. 各教材情報を textbook_order_items テーブルに保存
      const orderItems = items.map(item => ({
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
        unit_price: item.unit_price ? parseInt(item.unit_price, 10) : null
      }));

      const { error: itemsError } = await supabase
        .from('textbook_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. 注文通知メール（メール送信が失敗しても注文は完了とする）
      try {
        // 管理者メールアドレスを取得（RLSエラーでも続行）
        let adminEmail = "adakikryo87@gmail.com"; // デフォルト
        try {
          const { data: emailKey } = await supabase
            .from('access_keys')
            .select('access_code')
            .eq('key_type', 'admin_notification_email')
            .maybeSingle();
          if (emailKey?.access_code) adminEmail = emailKey.access_code;
        } catch (_) { /* DBから取得できなくてもデフォルトを使用 */ }

        const itemsListHtml = items.map((item, idx) => `
          <div style="border-bottom: 1px solid #edf2f7; padding: 10px 0; font-size: 0.95rem;">
            <p style="margin: 0 0 5px 0; font-weight: bold;">${idx + 1}. ${item.textbook_name}（${item.publisher}）</p>
            <p style="margin: 0; color: #4a5568;">教科: ${item.subject || "-"} / 学年: ${item.target_grades.join("、")} / 冊数: 生徒用${item.student_quantity}冊, 教員用${item.teacher_quantity}冊</p>
            ${item.remarks ? `<p style="margin: 5px 0 0 0; color: #718096; font-size: 0.85rem;">備考: ${item.remarks}</p>` : ''}
          </div>
        `).join("");

        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminEmail,
            subject: `【HP注文通知】補助教材の注文が入りました（${commonInfo.school_name}）`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px;">
                <h2 style="color: #2c5282; border-bottom: 2px solid #2c5282; padding-bottom: 10px;">HPからの教材注文通知</h2>
                <p>HPより以下の注文が入りました。</p>
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 5px 0;"><strong>学校名:</strong> ${commonInfo.school_name}</p>
                  <p style="margin: 5px 0;"><strong>担当先生:</strong> ${commonInfo.teacher_name} 先生</p>
                  <p style="margin: 5px 0;"><strong>学校電話:</strong> ${commonInfo.school_phone}</p>
                  <p style="margin: 5px 0;"><strong>個人電話:</strong> ${commonInfo.personal_phone || "-"}</p>
                  <p style="margin: 5px 0;"><strong>受付ID:</strong> ${orderId}</p>
                </div>
                <h3 style="font-size: 1.1rem; border-left: 4px solid #2c5282; padding-left: 10px; margin-top: 30px;">ご注文内容</h3>
                ${itemsListHtml}
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #718096;">
                  <p>※このメールはHP注文フォームより自動送信されています。詳細は管理画面を確認してください。</p>
                </div>
              </div>
            `,
            text: `HPより補助教材の注文が入りました。\n\n学校名: ${commonInfo.school_name}\n担当先生: ${commonInfo.teacher_name} 先生\n電話: ${commonInfo.school_phone}\n\n【ご注文内容】\n${items.map((it, i) => `${i+1}. ${it.textbook_name} (${it.publisher}) / 生徒${it.student_quantity}冊, 教員${it.teacher_quantity}冊`).join("\n")}`
          }),
        });
      } catch (mailErr) {
        console.error("Failed to send notification email:", mailErr);
      }

      alert("ご注文の送信が完了しました！");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました。データベースが正しく構築されているか確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirming) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 className="section-heading" style={{ borderBottom: "2px solid var(--kusano-theme)", width: "100%", paddingBottom: "10px", marginBottom: "30px" }}>
          ご注文内容の確認
        </h1>
        
        <div style={{ backgroundColor: "var(--surface-light)", padding: "20px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "15px", color: "var(--kusano-theme)" }}>【1】先生（ご注文者様）の情報</h2>
          <p style={{ marginBottom: "8px" }}><strong>学校名：</strong> {commonInfo.school_name}</p>
          <p style={{ marginBottom: "8px" }}><strong>ご担当者名：</strong> {commonInfo.teacher_name}</p>
          <p style={{ marginBottom: "8px" }}><strong>学校電話番号：</strong> {commonInfo.school_phone}</p>
          <p style={{ marginBottom: "0" }}><strong>携帯電話番号：</strong> {commonInfo.personal_phone || "-"}</p>
        </div>

        <div style={{ backgroundColor: "var(--surface-light)", padding: "20px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--kusano-theme)" }}>【2】ご注文の教材一覧</h2>
            <button type="button" onClick={downloadExcel} style={{ padding: "8px 15px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
              Excelで控えをダウンロード
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", backgroundColor: "white" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>教材名</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>出版社</th>
                  <th style={{ padding: "10px", textAlign: "left", whiteSpace: "nowrap" }}>学年</th>
                  <th style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>本体価格</th>
                  <th style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>生徒用</th>
                  <th style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>教員用</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px" }}>{item.textbook_name}</td>
                    <td style={{ padding: "10px" }}>{item.publisher}</td>
                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{item.target_grades.join("、")}</td>
                    <td style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>{item.unit_price ? `¥${item.unit_price}` : "-"}</td>
                    <td style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>{item.student_quantity}</td>
                    <td style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>{item.teacher_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "40px", flexWrap: "wrap" }}>
          <button onClick={() => setIsConfirming(false)} style={{ padding: "15px 30px", backgroundColor: "#64748b", color: "white", border: "none", borderRadius: "5px", fontSize: "1.1rem", cursor: "pointer" }}>
            戻って修正する
          </button>
          <button onClick={handleFinalSubmit} disabled={isSubmitting} style={{ padding: "15px 40px", backgroundColor: isSubmitting ? "#ccc" : "#dc3545", color: "white", border: "none", borderRadius: "5px", fontSize: "1.1rem", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(220,53,69,0.3)" }}>
            {isSubmitting ? "送信中..." : "この内容で注文を確定する"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 className="section-heading" style={{ borderBottom: "2px solid var(--kusano-theme)", width: "100%", paddingBottom: "10px", marginBottom: "30px" }}>
        補助教材 ご注文フォーム
      </h1>

      <form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* --- 共通情報セクション --- */}
        <section style={{ backgroundColor: "var(--surface-light)", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "20px", color: "var(--kusano-theme)" }}>【1】先生（ご注文者様）の情報</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
            {/* --- 学校の選択 --- */}
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 150px" }}>
                <label style={{ fontWeight: "bold" }}>学校種別 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
                <select required name="school_type" value={commonInfo.school_type} onChange={handleTypeChange}>
                  <option value="">--選択--</option>
                  {Object.entries(schoolTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {commonInfo.school_type !== "special" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 150px" }}>
                  <label style={{ fontWeight: "bold" }}>地区 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
                  <select required={commonInfo.school_type !== "special"} name="school_area" value={commonInfo.school_area} onChange={handleAreaChange} disabled={!commonInfo.school_type}>
                    <option value="">--選択--</option>
                    {Object.entries(areaLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "2 1 250px" }}>
                <label style={{ fontWeight: "bold" }}>学校名 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
                <select required name="school_name" value={commonInfo.school_name} onChange={handleCommonChange} disabled={(commonInfo.school_type !== "special" && !commonInfo.school_area) || availableSchools.length === 0}>
                  <option value="">--学校を選択--</option>
                  {availableSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold" }}>ご担当者名（先生） <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
              <input required name="teacher_name" value={commonInfo.teacher_name} onChange={handleCommonChange} placeholder="" />
            </div>


            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 200px" }}>
                <label style={{ fontWeight: "bold" }}>学校の電話番号 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
                <input required name="school_phone" value={commonInfo.school_phone} onChange={handleCommonChange} placeholder="例: 095xxxxxxx" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 200px" }}>
                <label style={{ fontWeight: "bold" }}>個人の電話番号</label>
                <input name="personal_phone" value={commonInfo.personal_phone} onChange={handleCommonChange} placeholder="例: 090xxxxxxxx" />
              </div>
            </div>

          </div>
        </section>

        {/* --- 個別教材セクション --- */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--kusano-theme)" }}>【2】ご注文の教材（複数追加可能）</h2>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{index + 1}</h3>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} style={{ color: "red", fontSize: "14px", padding: "4px 8px", border: "1px solid red", borderRadius: "4px" }}>
                    削除する
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                  <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>教材名 <span style={{ color: "red" }}>*</span></label>
                    <input required name="textbook_name" value={item.textbook_name} onChange={(e) => handleItemChange(index, e)} placeholder="（例）基礎からの数学I+A" />
                  </div>
                  <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>教科</label>
                    <input name="subject" value={item.subject} onChange={(e) => handleItemChange(index, e)} placeholder="（例）数学" />
                  </div>
                  <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>出版社 <span style={{ color: "red" }}>*</span></label>
                    <input required name="publisher" value={item.publisher} onChange={(e) => handleItemChange(index, e)} placeholder="（例）数研出版" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>採用学年（複数選択可）</label>
                    <div style={{ display: "flex", gap: "15px" }}>
                      {["1年", "2年", "3年"].map(grade => (
                        <label key={grade} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={item.target_grades.includes(grade)}
                            onChange={() => handleGradeCheck(index, grade)}
                          />
                          {grade}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>本体価格</label>
                    <input type="text" inputMode="numeric" min="0" name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(index, e)} placeholder="1500" />
                  </div>
                  <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>冊数（生徒用） <span style={{ color: "red" }}>*</span></label>
                    <input required type="text" inputMode="numeric" min="0" name="student_quantity" value={item.student_quantity} onChange={(e) => handleItemChange(index, e)} placeholder="150" />
                  </div>
                  <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>冊数（教員用） <span style={{ color: "red" }}>*</span></label>
                    <input required type="text" inputMode="numeric" min="0" name="teacher_quantity" value={item.teacher_quantity} onChange={(e) => handleItemChange(index, e)} placeholder="5" />
                  </div>
                </div>

                {/* 付属物の詳細 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "13px" }}>本体</label>
                    <select name="main_item_type" value={item.main_item_type} onChange={(e) => handleItemChange(index, e)}>
                      <option value="冊子">冊子</option>
                      <option value="バラ">バラ</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "13px" }}>解答</label>
                    <select name="answer_type" value={item.answer_type} onChange={(e) => handleItemChange(index, e)}>
                      <option value="なし">なし</option>
                      <option value="冊子">冊子</option>
                      <option value="バラ">バラ</option>
                    </select>
                  </div>
                  
                  {item.answer_type !== "なし" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontWeight: "bold", fontSize: "13px" }}>解答の添付</label>
                      <select name="answer_attached" value={item.answer_attached} onChange={(e) => handleItemChange(index, e)}>
                        <option value="つける">つける</option>
                        <option value="はずす">はずす</option>
                      </select>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "13px" }}>付属品</label>
                    <select name="accessory_type" value={item.accessory_type} onChange={(e) => handleItemChange(index, e)}>
                      <option value="なし">なし</option>
                      <option value="冊子">冊子</option>
                      <option value="バラ">バラ</option>
                    </select>
                  </div>

                  {item.accessory_type !== "なし" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontWeight: "bold", fontSize: "13px" }}>付属品の添付</label>
                      <select name="accessory_attached" value={item.accessory_attached} onChange={(e) => handleItemChange(index, e)}>
                        <option value="つける">つける</option>
                        <option value="はずす">はずす</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 納品形態と備考 */}
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", borderTop: "1px dashed #ccc", paddingTop: "15px" }}>
                  <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>納品形態</label>
                    <select name="delivery_method" value={item.delivery_method} onChange={(e) => handleItemChange(index, e)}>
                      <option value="納品">納品</option>
                      <option value="販売">販売</option>
                    </select>
                  </div>

                  {item.delivery_method === "納品" && (
                    <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontWeight: "bold", fontSize: "14px" }}>請求先</label>
                      <select name="billing_target" value={item.billing_target} onChange={(e) => handleItemChange(index, e)}>
                        <option value="学校">学校宛</option>
                        <option value="個人">先生個人宛</option>
                      </select>
                    </div>
                  )}

                  {item.delivery_method === "販売" && (
                     <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                       <label style={{ fontWeight: "bold", fontSize: "14px" }}>販売希望日</label>
                       <input type="date" name="requested_date" value={item.requested_date} onChange={(e) => handleItemChange(index, e)} />
                     </div>
                  )}
                  
                  <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>備考（教員からの要望など）</label>
                    <textarea name="remarks" value={item.remarks} onChange={(e) => handleItemChange(index, e)} rows={2} placeholder="特別なご要望があればご記入ください" />
                  </div>
                </div>

              </div>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addItem} 
            style={{ 
              width: "100%", padding: "15px", backgroundColor: "white", color: "var(--kusano-theme)", 
              border: "2px dashed var(--kusano-theme)", borderRadius: "8px", fontWeight: "bold",
              fontSize: "16px", cursor: "pointer", transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f0f8f1"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
          >
            ＋ さらに別の教材を追加する
          </button>
        </section>

        <section style={{ textAlign: "center", marginTop: "20px" }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary" 
            style={{ fontSize: "1.2rem", padding: "15px 40px", backgroundColor: isSubmitting ? "#ccc" : "#dc3545", boxShadow: "0 4px 10px rgba(220,53,69,0.3)" }}
          >
            {isSubmitting ? "処理中..." : "注文を確認する"}
          </button>
        </section>

      </form>
    </div>
  );
}
