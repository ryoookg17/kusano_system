const fs = require('fs');
const path = 'src/app/textbook/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. 変数名とロジックの修正
content = content.replace(/const orderItems = orderItems\.map/g, 'const itemsToSave = orderItems.map');
content = content.replace(/await supabase\.from\('textbook_order_items'\)\.insert\(orderItems\);/g, "await supabase.from('textbook_order_items').insert(itemsToSave);");

// 2. 文字化けと構文エラーの修正
const replacements = [
    // 構文エラー（クォート補完）
    { from: /\.join\("、\)/g, to: '.join("、")' },
    { from: /!== "なし \?/g, to: '!== "なし" ?' },
    { from: /\|\| "冊子,/g, to: '|| "冊子",' },
    { from: /\|\| "なし,/g, to: '|| "なし",' },
    
    // 文字化けラベル・メッセージ
    { from: /蟷ｴ/g, to: '年' },
    { from: /縲・/g, to: '、' },
    { from: /蜀雁ｭ・/g, to: '冊子' },
    { from: /邏榊刀/g, to: '納品' },
    { from: /蟄ｦ譬｡/g, to: '学校' },
    { from: /縺ｪ縺・/g, to: 'なし' },
    { from: /縺ｯ縺壹☆/g, to: 'はずす' },
    { from: /雋ｩ螢ｲ/g, to: '販売' },
    { from: /縺､縺代ける/g, to: 'つける' },
    { from: /縺､縺代ｋ/g, to: 'つける' },
    { from: /譖ｴ譁ｰ蜃ｦ逅・/g, to: '更新処理' },
    { from: /譁ｰ隕丈ｽ懈・蜃ｦ逅・/g, to: '新規作成処理' },
    { from: /豕ｨ譁・ｒ譖ｴ譁ｰ縺励∪縺励◆、/g, to: '注文を更新しました。' },
    { from: /豕ｨ譁・ｒ逋ｻ骭ｲ縺励∪縺励◆、/g, to: '注文を登録しました。' },
    { from: /逋ｻ骭ｲ縺ｫ螟ｱ謨励＠縺ｾ縺励◆、/g, to: '登録に失敗しました。' },
    { from: /豕ｨ譁・ｒ蜈･蜉・/g, to: '注文を入力' },
    { from: /豕ｨ譁・ｹｴ譛域律/g, to: '注文年月日' },
    { from: /学校遞ｮ蛻･/g, to: '学校種別' },
    { from: /驕ｸ謚・/g, to: '選択' },
    { from: /蝨ｰ蛹ｺ/g, to: '地区' },
    { from: /学校蜷・/g, to: '学校名' },
    { from: /学校繧帝∈謚・/g, to: '学校を選択' },
    { from: /諡・ｽ灘・逕溷錐/g, to: '担当先生名' },
    { from: /学校髮ｻ隧ｱ逡ｪ蜿ｷ/g, to: '学校電話番号' },
    { from: /雋ｺ蟶ｯ髮ｻ隧ｱ/g, to: '携帯電話' },
    { from: /蠖｢蠑・/g, to: '形式' },
    { from: /繝舌Λ/g, to: 'バラ' },
    { from: /繝励Ξ繝薙Η繝ｼ/g, to: 'プレビュー' },
    { from: /豕ｨ譁・ｒ逋ｻ骭ｲ縺吶ｋ/g, to: '注文を登録する' },
    { from: /繧ｭ繝｣繝ｳ繧ｻ繝ｫ/g, to: 'キャンセル' },
    { from: /縺薙謨吝干繧貞炎髯､/g, to: 'この教材を削除' },
    { from: /謨吝干繧定ｿｽ蜉/g, to: '教材を追加' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

// 重複修正（二重置換の防止など）
content = content.replace(/注文年月日年月日/g, '注文年月日');

fs.writeFileSync(path, content, 'utf8');
console.log("Deep cleanup and fix completed.");
