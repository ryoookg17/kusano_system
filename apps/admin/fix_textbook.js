const fs = require('fs');
const path = 'src/app/textbook/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. 変数名の統一 (items -> orderItems, setItems -> setOrderItems)
// モーダル内のスコープに限定して置換
const modalStart = content.indexOf('export function OrderEntryModal');
if (modalStart !== -1) {
    let modalContent = content.substring(modalStart);
    modalContent = modalContent.replace(/\bitems\b/g, 'orderItems');
    modalContent = modalContent.replace(/\bsetItems\b/g, 'setOrderItems');
    // すでに orderItems になっている箇所の重複を修正
    modalContent = modalContent.replace(/\borderItems\b/g, 'orderItems');
    content = content.substring(0, modalStart) + modalContent;
}

// 2. 文字化けの修正
const replacements = [
    { from: /蟷ｴ/g, to: '年' },
    { from: /縲・/g, to: '、' },
    { from: /蜀雁ｭ・/g, to: '冊子' },
    { from: /邏榊刀/g, to: '納品' },
    { from: /蟄ｦ譬｡/g, to: '学校' },
    { from: /縺ｪ縺・/g, to: 'なし' },
    { from: /縺ｯ縺壹☆/g, to: 'はずす' },
    { from: /雋ｩ螢ｲ/g, to: '販売' },
    { from: /縺､縺代ｋ/g, to: 'つける' },
    { from: /譖ｴ譁ｰ蜃ｦ逅・/g, to: '更新処理' },
    { from: /譁ｰ隕丈ｽ懈・蜃ｦ逅・/g, to: '新規作成処理' },
    { from: /豕ｨ譁・ｒ譖ｴ譁ｰ縺励∪縺励◆縲・/g, to: '注文を更新しました。' },
    { from: /豕ｨ譁・ｒ逋ｻ骭ｲ縺励∪縺励◆縲・/g, to: '注文を登録しました。' },
    { from: /縺薙謨吝干繧貞炎髯､/g, to: 'この教材を削除' },
    { from: /謨吝干繧定ｿｽ蜉/g, to: '教材を追加' },
    { from: /豕ｨ譁・ｒ逋ｻ骭ｲ縺吶ｋ/g, to: '注文を登録する' },
    { from: /繧ｭ繝｣繝ｳ繧ｻ繝ｫ/g, to: 'キャンセル' },
    { from: /蛟倶ｺｺ/g, to: '個人' },
    { from: /邏榊刀蟶悟ｾ帶律/g, to: '納品希望日' },
    { from: /雋ｩ螢ｲ蟶悟ｾ帶律/g, to: '販売希望日' },
    { from: /隲区ｱょ・/g, to: '請求先' },
    { from: /陦悟粋/g, to: '帳合' },
    { from: /陦悟粋繧剃ｿｮ豁修正/g, to: '帳合を修正' },
    { from: /陦悟粋繧呈・螳・/g, to: '帳合を確定' },
    { from: /縺薙蜀螳ｹ縺ｧ逋ｻ骭ｲ/g, to: 'この内容で登録' },
    { from: /縺ゅ→縺ｧ/g, to: 'あとで' },
    { from: /繝舌Λ/g, to: 'バラ' },
    { from: /繝励Ξ繝薙Η繝ｼ/g, to: 'プレビュー' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed mojibake and variable shadowing successfully.");
