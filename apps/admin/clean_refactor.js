const fs = require('fs');

const path = 'src/app/textbook/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Mojibake correction for the rest of the file
const mojibakeMap = {
  "縲・": "、",
  "蜀雁ｭ・": "冊子",
  "縺ｪ縺・": "なし",
  "縺ｯ縺壹☆": "はずす",
  "邏榊刀": "納品",
  "蟄ｦ譬｡": "学校",
  "譖ｴ譁ｰ蜃ｦ逅・": "更新処理",
  "螳御ｺ・": "完了",
  "譛ｪ蟇ｾ蠢・": "未対応",
  "縺薙・繝・・繧ｿ繧貞炎髯､縺励※繧ゅｈ繧阪＠縺・〒縺吶°・・": "このデータを削除してもよろしいですか？",
  "蜑企勁縺ｫ螟ｱ謨励＠縺ｾ縺励◆": "削除に失敗しました",
  "蜃ｺ蜉帙☆繧九い繧､繝・Β繧帝∈謚槭＠縺ｦ縺上□縺輔＞、": "出力するアイテムを選択してください。",
  "HP縺ｮ豕ｨ譁・律譎ゑｼ・rder.created_at・峨ｒ蝓ｺ貅悶↓髯埼・〒繧ｽ繝ｼ繝医☆繧・": "HPの注文日時（order.created_at）を基準に降順でソートする",
  "繧ｹ繝・・繧ｿ繧ｹ縺ｮ譖ｴ譁ｰ縺ｫ螟ｱ謨励＠縺ｾ縺励◆、B縺ｮ讒狗ｯ臥憾豕√ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞、": "ステータスの更新に失敗しました。DBの構築状況を確認してください。",
  "繝・・繧ｿ縺後≠繧翫∪縺帙ｓ、": "データがありません。",
  "陬懷勧謨呎攝邂｡逅・": "補助教材管理",
  "謗｡逕ｨ豕ｨ譁・嶌蜃ｺ蜉・": "採用注文書出力",
  "Excel蜃ｺ蜉・": "Excel出力",
  "学校蜷阪〒邨槭ｊ霎ｼ縺ｿ...": "学校名で絞り込み...",
  "繝倥ャ繝€繝ｼ繧ｨ繝ｪ繧｢": "ヘッダーエリア",
  "繝輔ぅ繝ｫ繧ｿ繧ｨ繝ｪ繧｢": "フィルタエリア",
  "蛟倶ｺｺ": "個人",
  "蛯呵€・": "備考",
  "縺薙・謨呎攝繧貞炎髯､": "この教材を削除",
  "謨呎攝繧定ｿｽ蜉": "教材を追加",
  "萓・ 095-xxx-xxxx": "例: 095-xxx-xxxx",
  "謨呎攝蜀・ｮｹ": "教材内容",
  "謨呎攝蜷・": "教材名",
  "蜃ｺ迚育､ｾ": "出版社",
  "謨咏ｧ・": "教科",
  "萓・ 謨ｰ蟄ｦ": "例: 数学",
  "譛ｬ菴謎ｾ｡譬ｼ": "本体価格",
  "譛ｬ菴・": "本体",
  "隗｣遲・": "解答",
  "隗｣遲斐・豺ｻ莉・": "解答の添付",
  "莉伜ｱ槫刀": "付属品",
  "莉伜ｱ槫刀豺ｻ莉・": "付属品添付",
  "蟄ｦ年": "学年",
  "逕溷ｾ呈焚": "生徒数",
  "謨吝藤謨ｰ": "教員数",
  "蠖｢諷・": "形態",
  "隲区ｱょ・": "請求先",
  "販売蟶梧悍譌･": "販売希望日"
};

for (const [key, value] of Object.entries(mojibakeMap)) {
  content = content.split(key).join(value);
}

// 2. Extract OrderEntryModal
const importsEnd = content.indexOf('function TextbookAdminContent()');

const orderEntryModalCode = `
export function OrderEntryModal({ onClose, onSuccess, initialItem }: { onClose: () => void, onSuccess: () => void, initialItem?: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commonInfo, setCommonInfo] = useState({
    order_date: initialItem?.order?.created_at ? new Date(initialItem.order.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    school_type: initialItem?.order?.school_name ? (Object.keys(schoolData).find(area => schoolData[area].includes(initialItem.order.school_name)) ? "public" : "special") : "",
    school_area: "",
    school_name: initialItem?.order?.school_name || "",
    teacher_name: initialItem?.order?.teacher_name || "",
    school_phone: initialItem?.order?.school_phone || "",
    personal_phone: initialItem?.order?.personal_phone || "",
  });

  const [orderItems, setOrderItems] = useState(initialItem ? [{
    textbook_name: initialItem.textbook_name || "",
    publisher: initialItem.publisher || "",
    subject: initialItem.subject || "",
    target_grades: initialItem.target_grade ? String(initialItem.target_grade).split("、").map((g: string) => g.trim().includes("年") ? g.trim() : \`\${g.trim()}年\`) : [],
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

  const suggestVendor = (publisher: string, schoolName: string) => {
    return "";
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (typeof value === 'string' && ['unit_price', 'student_quantity', 'teacher_quantity'].includes(name)) {
      value = value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, '');
    }
    const next = [...orderItems];
    next[index] = { ...next[index], [name]: value };
    
    if (name === "publisher") {
      next[index].accounting_vendor = suggestVendor(value, commonInfo.school_name);
    }
    setOrderItems(next);
  };

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      {
        textbook_name: "", publisher: "", subject: "", target_grades: [], student_quantity: "", teacher_quantity: "",
        main_item_type: "冊子", answer_type: "なし", answer_attached: "はずす", accessory_type: "なし", accessory_attached: "はずす",
        delivery_method: "納品", billing_target: "学校", requested_date: "", remarks: "", unit_price: "", accounting_vendor: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialItem) {
        const { error: orderError } = await supabase
          .from('textbook_orders')
          .update({
            created_at: commonInfo.order_date,
            school_name: commonInfo.school_name,
            teacher_name: commonInfo.teacher_name,
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
        const orderId = crypto.randomUUID();
        const { error: orderError } = await supabase
          .from('textbook_orders')
          .insert([{
            id: orderId,
            created_at: commonInfo.order_date,
            school_name: commonInfo.school_name,
            teacher_name: commonInfo.teacher_name,
            school_phone: commonInfo.school_phone,
            personal_phone: commonInfo.personal_phone
          }]);
        if (orderError) throw orderError;

        const itemsToSave = orderItems.map(item => ({
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
            <input required type="date" value={commonInfo.order_date} onChange={(e) => setCommonInfo({ ...commonInfo, order_date: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000", fontSize: "1rem" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", color: "#000" }}>学校名</label>
              <input required type="text" value={commonInfo.school_name} onChange={(e) => setCommonInfo({ ...commonInfo, school_name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", color: "#000" }}>担当先生名</label>
              <input required type="text" value={commonInfo.teacher_name} onChange={(e) => setCommonInfo({ ...commonInfo, teacher_name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", borderLeft: "4px solid #1e293b", paddingLeft: "10px", marginBottom: "20px", color: "#000" }}>教材内容</h3>
          {orderItems.map((item, idx) => (
            <div key={idx} style={{ padding: "20px", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "20px", backgroundColor: "#f8fafc", position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>教材名</label>
                  <input required name="textbook_name" type="text" value={item.textbook_name} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>出版社</label>
                  <input required name="publisher" type="text" value={item.publisher} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>教科</label>
                  <input name="subject" type="text" value={item.subject} onChange={(e) => handleItemChange(idx, e)} placeholder="例: 数学" style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>本体価格</label>
                  <input name="unit_price" type="number" value={item.unit_price} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>本体</label>
                  <select name="main_item_type" value={item.main_item_type} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="冊子">冊子</option>
                    <option value="バラ">バラ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", marginBottom: "15px", backgroundColor: "rgba(255,255,255,0.4)", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>解答</label>
                  <select name="answer_type" value={item.answer_type} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="なし">なし</option>
                    <option value="冊子">冊子</option>
                    <option value="バラ">バラ</option>
                  </select>
                </div>
                {item.answer_type !== "なし" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>解答の添付</label>
                    <select name="answer_attached" value={item.answer_attached} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                      <option value="つける">つける</option>
                      <option value="はずす">はずす</option>
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>付属品</label>
                  <select name="accessory_type" value={item.accessory_type} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="なし">なし</option>
                    <option value="冊子">冊子</option>
                    <option value="バラ">バラ</option>
                  </select>
                </div>
                {item.accessory_type !== "なし" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>付属品添付</label>
                    <select name="accessory_attached" value={item.accessory_attached} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
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
                          if (next[idx].target_grades.includes(g)) next[idx].target_grades = next[idx].target_grades.filter(v => v !== g);
                          else next[idx].target_grades = [...next[idx].target_grades, g].sort();
                          setOrderItems(next);
                        }} /> {g}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>生徒数</label>
                  <input required name="student_quantity" type="number" value={item.student_quantity} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>教員数</label>
                  <input required name="teacher_quantity" type="number" value={item.teacher_quantity} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>形態</label>
                  <select name="delivery_method" value={item.delivery_method} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                    <option value="納品">納品</option>
                    <option value="販売">販売</option>
                  </select>
                </div>
                <div>
                  {item.delivery_method === "納品" ? (
                    <>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>請求先</label>
                      <select name="billing_target" value={item.billing_target} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#000" }}>
                        <option value="学校">学校</option>
                        <option value="個人">個人</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>販売希望日</label>
                      <input name="requested_date" type="date" value={item.requested_date} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px", backgroundColor: "white", color: "#000" }} />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px", color: "#000" }}>備考</label>
                <textarea name="remarks" value={item.remarks} onChange={(e) => handleItemChange(idx, e)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "white", color: "#000" }} />
              </div>
              {orderItems.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} style={{ color: "red", border: "none", background: "none", fontSize: "12px", marginTop: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Trash2 size={14} /> この教材を削除</button>
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
`;

content = content.substring(0, importsEnd) + orderEntryModalCode + '\n' + content.substring(importsEnd);

// 3. Carefully replace the inline modal inside TextbookAdminContent
const inlineModalStart = content.indexOf('{isEntryModalOpen && (\\n        <div style={{ position: "fixed", top: 0, left: 0');
if (inlineModalStart !== -1) {
  // It's not this exact string, let's find the start of the modal div dynamically
}

const inlineDivIndex = content.indexOf('<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)"');
if (inlineDivIndex !== -1) {
  // We need to replace the entire inline modal.
  // We know it ends with:
  // </form>
  // </div>
  // </div>
  // )}
  // </div>
  // );
  
  const endFormStr = '</form>';
  const endFormIndex = content.indexOf(endFormStr, inlineDivIndex);
  if (endFormIndex !== -1) {
    const endDiv1 = content.indexOf('</div>', endFormIndex);
    const endDiv2 = content.indexOf('</div>', endDiv1 + 6);
    
    // So the inline modal string to replace is from inlineDivIndex to endDiv2 + 6
    const toReplace = content.substring(inlineDivIndex, endDiv2 + 6);
    content = content.replace(toReplace, `<OrderEntryModal 
        initialItem={editingItem} 
        onClose={() => { setIsEntryModalOpen(false); setEditingItem(null); }} 
        onSuccess={() => { setIsEntryModalOpen(false); setEditingItem(null); fetchItems(); }} 
      />`);
  }
}

// Ensure TS errors related to missing TS types on array maps are fixed
content = content.replace('schoolData[selectedArea].map(s =>', 'schoolData[selectedArea].map((s: string) =>');

fs.writeFileSync(path, content, 'utf8');
console.log("Clean refactor complete.");
