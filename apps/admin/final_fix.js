const fs = require('fs');

const path = 'src/app/textbook/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Mojibake correction
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

// 2. Export OrderEntryModal
content = content.replace(
  'function OrderEntryModal({ onClose, onSuccess, initialItem }',
  'export function OrderEntryModal({ onClose, onSuccess, initialItem }'
);

// 3. Fix TS any types
content = content.replace('schoolData[selectedArea].map(s =>', 'schoolData[selectedArea].map((s: string) =>');
content = content.replace('filter(v =>', 'filter((v: string) =>');

// 4. Update target_grade splitting (fixing the issue where numbers throw .split is not a function)
content = content.replace(
  'target_grades: initialItem.target_grade ? initialItem.target_grade.split("、") : []',
  'target_grades: initialItem.target_grade ? String(initialItem.target_grade).split("、").map((g: string) => g.trim().includes("年") ? g.trim() : `${g.trim()}年`) : []'
);

// 5. Replace `items` and `setItems` with `orderItems` and `setOrderItems` inside OrderEntryModal ONLY
const modalStartIndex = content.indexOf('export function OrderEntryModal');
if (modalStartIndex !== -1) {
  let beforeModal = content.substring(0, modalStartIndex);
  let modalContent = content.substring(modalStartIndex);
  
  modalContent = modalContent.replace(/const \[items, setItems\]/g, 'const [orderItems, setOrderItems]');
  // Replace references to items/setItems within the modal string
  // We use word boundaries where possible
  modalContent = modalContent.replace(/\bitems\[0\]\b/g, 'orderItems[0]');
  modalContent = modalContent.replace(/\[\.\.\.items/g, '[...orderItems');
  modalContent = modalContent.replace(/\bitems\.map\(/g, 'orderItems.map(');
  modalContent = modalContent.replace(/\bitems\.length\b/g, 'orderItems.length');
  modalContent = modalContent.replace(/\bitems\.filter\(/g, 'orderItems.filter(');
  modalContent = modalContent.replace(/\bsetItems\(/g, 'setOrderItems(');
  
  content = beforeModal + modalContent;
}

fs.writeFileSync(path, content, 'utf8');
console.log("Final perfect fix completed!");
