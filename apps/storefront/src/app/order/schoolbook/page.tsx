"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { allSchoolData as schoolList, schoolTypeLabels, areaLabels } from "@shared/schools";



export default function SchoolBookOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<"fast" | "standard">("fast");
  const [bulkIsbnText, setBulkIsbnText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 注文の共通情報
  const [commonInfo, setCommonInfo] = useState({
    school_type: "",
    school_area: "",
    school_name: "",
    teacher_name: "",
    email: "",
    school_phone: "",
    personal_phone: "",
    remarks: "",
  });

  // 図書の情報
  const [items, setItems] = useState([
    {
      serial_number: 1,
      book_title: "",
      author: "",
      publisher: "",
      price_excluding_tax: "",
      price_including_tax: "",
      isbn: "",
      quantity: "1",
      searchQuery: "" // 検索用の一時フィールド
    },
  ]);

  const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (typeof value === 'string' && ['price_excluding_tax', 'price_including_tax', 'quantity'].includes(name)) {
      value = value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, '');
    }
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [name]: value };
    setItems(newItems);
  };

  // 単一のISBN/クエリで検索する共通ロジック
  const searchBook = async (query: string) => {
    if (!query.trim()) return null;
    
    try {
      const isISBN = /^\d+$/.test(query.replace(/-/g, ""));
      if (isISBN) {
        const isbnNum = query.replace(/-/g, "");
        const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbnNum}`);
        const data = await res.json();
        if (data && data[0]) {
          const summary = data[0].summary;
          let priceExcl = "";
          let priceIncl = "";
          const supply = data[0]?.onix?.ProductSupply?.SupplyDetail;
          if (supply?.Price) {
            const pObj = supply.Price.find((p: any) => p.PriceAmount);
            if (pObj) {
              const p = Number(pObj.PriceAmount);
              priceExcl = p.toString();
              priceIncl = Math.floor(p * 1.1).toString();
            }
          }
          return {
            book_title: summary.title || "",
            author: summary.author || "",
            publisher: summary.publisher || "",
            isbn: summary.isbn || isbnNum,
            price_excluding_tax: priceExcl,
            price_including_tax: priceIncl
          };
        }
      }

      // OpenBDで見つからないかISBNでない場合はGoogle Books
      const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`);
      const gbData = await gbRes.json();
      if (gbData.items && gbData.items.length > 0) {
        const info = gbData.items[0].volumeInfo;
        const sale = gbData.items[0].saleInfo;
        let pIncl = "";
        let pExcl = "";
        if (sale?.listPrice?.amount) {
          const a = sale.listPrice.amount;
          pIncl = Math.floor(a).toString();
          pExcl = Math.ceil(a / 1.1).toString();
        }
        return {
          book_title: info.title || "",
          author: info.authors ? info.authors.join(", ") : "",
          publisher: info.publisher || "",
          isbn: info.industryIdentifiers?.find((i: any) => i.type.startsWith("ISBN"))?.identifier || "",
          price_excluding_tax: pExcl,
          price_including_tax: pIncl
        };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleSearch = async (index: number) => {
    const query = items[index].searchQuery.trim();
    if (!query) {
      alert("ISBN または 書名 を入力してください");
      return;
    }
    setIsSearching(true);
    const result = await searchBook(query);
    setIsSearching(false);
    
    if (result) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], ...result };
      setItems(newItems);
    } else {
      alert("該当する書籍が見つかりませんでした。手入力をお願いします。");
    }
  };

  const handleBulkAdd = async () => {
    // 改行、カンマ（全角・半角）、空白で分割
    const isbns = bulkIsbnText.split(/[\n,、\s]+/).map(s => s.trim()).filter(s => s);
    if (isbns.length === 0) return;

    setIsSearching(true);
    const newItems = [...items];
    // 空の行が1つだけならそれを上書き対象にする
    const startIndex = (items.length === 1 && !items[0].isbn && !items[0].book_title) ? 0 : items.length;

    for (let i = 0; i < isbns.length; i++) {
      const result = await searchBook(isbns[i]);
      const newItem = {
        serial_number: 0, // 後で振り直し
        book_title: result?.book_title || "（不明）",
        author: result?.author || "",
        publisher: result?.publisher || "",
        price_excluding_tax: result?.price_excluding_tax || "",
        price_including_tax: result?.price_including_tax || "",
        isbn: result?.isbn || isbns[i],
        quantity: "1",
        searchQuery: ""
      };
      
      if (startIndex + i < newItems.length) {
        newItems[startIndex + i] = newItem;
      } else {
        newItems.push(newItem);
      }
    }

    setItems(newItems.map((it, idx) => ({ ...it, serial_number: idx + 1 })));
    setBulkIsbnText("");
    setIsSearching(false);
  };

  const addItem = () => {
    if (items.length >= 100) {
      alert("一度に注文できるのは100冊までです。それ以上の場合は、一度送信してから再度入力してください。");
      return;
    }
    setItems([
      ...items,
      {
        serial_number: items.length + 1,
        book_title: "",
        author: "",
        publisher: "",
        price_excluding_tax: "",
        price_including_tax: "",
        isbn: "",
        quantity: "1",
        searchQuery: ""
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // 連番を再計算
    setItems(newItems.map((item, i) => ({ ...item, serial_number: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase
        .from('schoolbook_orders')
        .insert([{
          id: orderId,
          school_type: commonInfo.school_type,
          school_area: commonInfo.school_area || null,
          school_name: commonInfo.school_name,
          teacher_name: commonInfo.teacher_name,
          email: commonInfo.email,
          school_phone: commonInfo.school_phone,
          personal_phone: commonInfo.personal_phone || null,
          remarks: commonInfo.remarks || null
        }]);
        
      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: orderId,
        serial_number: item.serial_number,
        book_title: item.book_title,
        author: item.author,
        publisher: item.publisher,
        price_excluding_tax: item.price_excluding_tax ? parseInt(item.price_excluding_tax, 10) : null,
        price_including_tax: item.price_including_tax ? parseInt(item.price_including_tax, 10) : null,
        isbn: item.isbn,
        quantity: parseInt(item.quantity || "1", 10),
      }));

      const { error: itemsError } = await supabase
        .from('schoolbook_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 注文確認メールの送信
      try {
        const booksListHtml = items.map((item, idx) => `
          <div style="border-bottom: 1px solid #edf2f7; padding: 10px 0; font-size: 0.95rem;">
            <p style="margin: 0 0 5px 0; font-weight: bold;">${idx + 1}. ${item.book_title}</p>
            <p style="margin: 0; color: #4a5568;">著者: ${item.author || "記載なし"} / 出版社: ${item.publisher} / 数量: ${item.quantity}冊</p>
            ${item.isbn ? `<p style="margin: 2px 0 0 0; color: #718096; font-size: 0.85rem;">ISBN: ${item.isbn}</p>` : ''}
          </div>
        `).join("");

        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: commonInfo.email,
            subject: `【くさの書店】図書のご注文を受け付けました（ID: ${orderId.slice(0, 8)}）`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px;">
                <h2 style="color: #702459; border-bottom: 2px solid #702459; padding-bottom: 10px;">学校図書 ご注文受付のお知らせ</h2>
                <p>${commonInfo.teacher_name} 様</p>
                <p>この度は、くさの書店への図書のご注文をいただき、誠にありがとうございます。<br>以下の内容で承りました。</p>
                
                <div style="background: #fff5f7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fed7e2;">
                  <p style="margin: 5px 0;"><strong>学校名:</strong> ${commonInfo.school_name}</p>
                  <p style="margin: 5px 0;"><strong>受付ID:</strong> ${orderId}</p>
                  ${commonInfo.remarks ? `<p style="margin: 10px 0 5px 0; border-top: 1px dashed #fed7e2; padding-top: 10px;"><strong>備考:</strong><br>${commonInfo.remarks.replace(/\n/g, '<br>')}</p>` : ''}
                </div>

                <h3 style="font-size: 1.1rem; border-left: 4px solid #702459; padding-left: 10px; margin-top: 30px;">ご注文内容</h3>
                ${booksListHtml}

                <p style="margin-top: 30px; font-size: 0.9rem; color: #4a5568;">※本メールは自動送信です。キャンセルの場合はお早めにお電話にてご連絡ください。</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="font-weight: bold; margin-bottom: 5px;">くさの書店</p>
                  <p style="font-size: 0.85rem; margin: 0;">ホームページ: <a href="https://kusano-bookstore.jp">https://kusano-bookstore.jp</a></p>
                </div>
              </div>
            `,
            text: `${commonInfo.teacher_name} 様\n\nくさの書店へのご注文ありがとうございます。\n以下の内容で承りました。\n\n学校名: ${commonInfo.school_name}\n受付ID: ${orderId}\n${commonInfo.remarks ? `備考: ${commonInfo.remarks}\n` : ''}\n【ご注文内容】\n${items.map((it, i) => `${i+1}. ${it.book_title} / ${it.quantity}冊`).join("\n")}\n\nお届けまで今しばらくお待ちください。`
          }),
        });
      } catch (mailErr) {
        console.error("Failed to send confirmation email:", mailErr);
      }

      alert("図書の注文が完了しました！");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("サーバー通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 className="section-heading" style={{ borderBottom: "2px solid var(--kusano-accent-enji)", color: "var(--kusano-accent-enji)", width: "100%", paddingBottom: "10px", marginBottom: "30px" }}>
        学校図書 ご注文フォーム
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* --- 共通情報セクション --- */}
        <section style={{ backgroundColor: "var(--surface-light)", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "20px", color: "var(--kusano-accent-enji)" }}>【1】ご発注者様の情報</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
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
              <label style={{ fontWeight: "bold" }}>ご担当者名 <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
              <input required name="teacher_name" value={commonInfo.teacher_name} onChange={handleCommonChange} placeholder="" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold" }}>メールアドレス <span style={{ color: "red", fontSize: "12px" }}>*</span></label>
              <input required type="email" name="email" value={commonInfo.email} onChange={handleCommonChange} />
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

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold" }}>備考（ご要望など）</label>
              <textarea name="remarks" value={commonInfo.remarks} onChange={handleCommonChange} rows={3} placeholder="配送や請求に関して特別な希望があればご記入ください" style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
            </div>

          </div>
        </section>

        {/* --- 個別図書セクション --- */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--kusano-accent-enji)" }}>【2】ご注文の図書</h2>
            <div style={{ display: "flex", gap: "5px", background: "#f0f0f0", padding: "4px", borderRadius: "8px" }}>
              <button 
                type="button"
                onClick={() => setInputMode("fast")}
                style={{ 
                  padding: "6px 15px", borderRadius: "6px", border: "none", fontSize: "14px", fontWeight: "bold",
                  background: inputMode === "fast" ? "var(--kusano-accent-enji)" : "transparent",
                  color: inputMode === "fast" ? "white" : "#666",
                  cursor: "pointer"
                }}
              >
                高速ISBNモード
              </button>
              <button 
                type="button"
                onClick={() => setInputMode("standard")}
                style={{ 
                  padding: "6px 15px", borderRadius: "6px", border: "none", fontSize: "14px", fontWeight: "bold",
                  background: inputMode === "standard" ? "var(--kusano-accent-enji)" : "transparent",
                  color: inputMode === "standard" ? "white" : "#666",
                  cursor: "pointer"
                }}
              >
                通常モード
              </button>
            </div>
          </div>

          {/* 一括追加エリア */}
          <div style={{ marginBottom: "25px", padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "8px" }}>ISBN一括追加（改行やカンマ区切りで複数入力可能）</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <textarea 
                value={bulkIsbnText}
                onChange={(e) => setBulkIsbnText(e.target.value)}
                placeholder="例: 9784... , 9784..."
                rows={3}
                style={{ flex: 1, padding: "10px", fontSize: "14px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              <button 
                type="button"
                onClick={handleBulkAdd}
                disabled={isSearching || !bulkIsbnText.trim()}
                style={{ 
                  padding: "10px 20px", height: "auto", minHeight: "80px", background: "var(--kusano-accent-enji)", 
                  color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {isSearching ? "検索中..." : "一括追加"}
              </button>
            </div>
          </div>

          {inputMode === "fast" ? (
            <div style={{ overflowX: "auto", background: "white", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                    <th style={{ padding: "12px", textAlign: "center", width: "50px" }}>#</th>
                    <th style={{ padding: "12px", textAlign: "left", width: "200px" }}>ISBN入力</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>書名 / 著者・出版社</th>
                    <th style={{ padding: "12px", textAlign: "center", width: "100px" }}>税込価格</th>
                    <th style={{ padding: "12px", textAlign: "center", width: "80px" }}>冊数</th>
                    <th style={{ padding: "12px", textAlign: "center", width: "60px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px", textAlign: "center", fontSize: "14px", color: "#666" }}>{index + 1}</td>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input 
                            name="searchQuery"
                            value={item.searchQuery}
                            onChange={(e) => handleItemChange(index, e as any)}
                            onBlur={() => { if(item.searchQuery && !item.book_title) handleSearch(index) }}
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleSearch(index); } }}
                            placeholder="ISBN入力"
                            style={{ width: "100%", padding: "8px", fontSize: "14px" }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "10px" }}>
                        {item.book_title ? (
                          <div>
                            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{item.book_title}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>{item.author} / {item.publisher}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#999", fontSize: "13px" }}>ISBNを入力してEnterまたは検索ボタン</span>
                        )}
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                          <span style={{ fontSize: "12px", color: "#666" }}>¥</span>
                          <input 
                            name="price_including_tax"
                            value={item.price_including_tax}
                            onChange={(e) => handleItemChange(index, e as any)}
                            type="text" inputMode="numeric"
                            placeholder="-"
                            style={{ width: "70px", padding: "6px 4px", fontSize: "14px", textAlign: "right", borderRadius: "4px", border: "1px solid #ddd" }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input 
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, e as any)}
                          type="text" inputMode="numeric"
                          style={{ width: "50px", padding: "6px 4px", textAlign: "center", borderRadius: "4px", border: "1px solid #ddd" }}
                        />
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button type="button" onClick={() => removeItem(index)} style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer", padding: "5px" }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {items.map((item, index) => (
                <div key={index} style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{item.serial_number}</h3>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ display: "flex" }}>
                        <input 
                          type="text" 
                          name="searchQuery" 
                          value={item.searchQuery} 
                          onChange={(e) => handleItemChange(index, e)} 
                          placeholder="ISBNを入力し自動入力" 
                          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, width: "180px" }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleSearch(index)}
                          style={{ backgroundColor: "var(--kusano-accent-enji)", color: "white", padding: "0 10px", borderTopRightRadius: "8px", borderBottomRightRadius: "8px", fontSize: "13px" }}
                        >
                          検索
                        </button>
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} style={{ color: "red", fontSize: "14px", padding: "4px 8px", border: "1px solid red", borderRadius: "4px", backgroundColor: "white" }}>
                          削除
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                      <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "14px" }}>書名 <span style={{ color: "red" }}>*</span></label>
                        <input required name="book_title" value={item.book_title} onChange={(e) => handleItemChange(index, e)} />
                      </div>
                      <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "14px" }}>著者名 <span style={{ color: "red" }}>*</span></label>
                        <input required name="author" value={item.author} onChange={(e) => handleItemChange(index, e)} />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "14px" }}>出版社 <span style={{ color: "red" }}>*</span></label>
                        <input required name="publisher" value={item.publisher} onChange={(e) => handleItemChange(index, e)} />
                      </div>
                      <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "14px" }}>ISBN</label>
                        <input name="isbn" value={item.isbn} onChange={(e) => handleItemChange(index, e)} placeholder="例: 9784..." />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", backgroundColor: "#fdf5f5", padding: "15px", borderRadius: "6px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "13px" }}>本体価格 (円)</label>
                        <input 
                          type="text" inputMode="numeric" 
                          min="0" 
                          name="price_excluding_tax" 
                          value={item.price_excluding_tax} 
                          onChange={(e) => handleItemChange(index, e)} 
                          style={{ transition: "background-color 0.5s", backgroundColor: item.price_excluding_tax ? "#f0fdf4" : "white" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "13px" }}>税込価格 (円)</label>
                        <input 
                          type="text" inputMode="numeric" 
                          min="0" 
                          name="price_including_tax" 
                          value={item.price_including_tax} 
                          onChange={(e) => handleItemChange(index, e)} 
                          style={{ transition: "background-color 0.5s", backgroundColor: item.price_including_tax ? "#f0fdf4" : "white" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "13px" }}>冊数 <span style={{ color: "red" }}>*</span></label>
                        <input required type="text" inputMode="numeric" min="1" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <button 
            type="button" 
            onClick={addItem} 
            style={{ 
              width: "100%", padding: "15px", backgroundColor: "white", color: "var(--kusano-accent-enji)", 
              border: "2px dashed var(--kusano-accent-enji)", borderRadius: "8px", fontWeight: "bold",
              fontSize: "16px", cursor: "pointer", transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fffdfd"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
          >
            ＋ さらに別の図書を追加する
          </button>
        </section>

        <section style={{ textAlign: "center", marginTop: "20px" }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary" 
            style={{ fontSize: "1.2rem", padding: "15px 40px", backgroundColor: isSubmitting ? "#ccc" : "#dc3545", boxShadow: "0 4px 10px rgba(220,53,69,0.3)" }}
          >
            {isSubmitting ? "送信中..." : "注文を確定する"}
          </button>
          <p style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
            ※注文内容を確認の上、確定ボタンを押してください。
          </p>
        </section>

      </form>
    </div>
  );
}
