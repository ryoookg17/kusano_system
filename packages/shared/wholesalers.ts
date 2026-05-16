/**
 * 帳合（ちょうあい）設定マスタ
 * 
 * 出版社名から帳合先を自動判定するための設定です。
 * 
 * 形式:
 * { 
 *   publisher: "出版社名", 
 *   vendor: "帳合先", 
 *   school: "対象校(空欄なら全校)", 
 *   keyword: "教材名に含まれるキーワード(任意)" 
 * }
 * 
 * ※判定の優先順位:
 * リストの上にあるものから順に判定されます。
 * 特定の学校や特定の教材（WINSTEPなど）の例外は、一般的なルールより上に書いてください。
 */
export const WHOLESALER_CONFIG = [
  // === 例外ルール（特定の教材や特定の学校） ===
  { "publisher": "ベネッセ", "vendor": "ベネッセ", "school": "", "keyword": "WINSTEP" },
  { "publisher": "ラーンズ", "vendor": "ラーンズ", "school": "", "keyword": "WINSTEP" },
  { "publisher": "山川出版社", "vendor": "県教", "school": "瓊浦高校", "keyword": "" },

  // --- きんぶん ---
  { "publisher": "学書", "vendor": "きんぶん", "school": "" },
  { "publisher": "エスト出版", "vendor": "きんぶん", "school": "" },
  { "publisher": "教育研究会", "vendor": "きんぶん", "school": "" },
  { "publisher": "正進社", "vendor": "きんぶん", "school": "" },
  { "publisher": "山川出版社", "vendor": "きんぶん", "school": "" },
  { "publisher": "教学社", "vendor": "きんぶん", "school": "" },
  { "publisher": "受験研究社", "vendor": "きんぶん", "school": "" },
  { "publisher": "数研出版", "vendor": "きんぶん", "school": "" },
  { "publisher": "浜島書店", "vendor": "きんぶん", "school": "" },
  { "publisher": "文英堂", "vendor": "きんぶん", "school": "" },
  { "publisher": "増進堂", "vendor": "きんぶん", "school": "" },
  { "publisher": "中部日本教育文化会", "vendor": "きんぶん", "school": "" },
  { "publisher": "美誠社", "vendor": "きんぶん", "school": "" },
  { "publisher": "啓隆社", "vendor": "きんぶん", "school": "" },
  { "publisher": "文理", "vendor": "きんぶん", "school": "" },
  { "publisher": "アルク", "vendor": "きんぶん", "school": "" },
  { "publisher": "とうほう", "vendor": "きんぶん", "school": "" },
  { "publisher": "桐原書店", "vendor": "きんぶん", "school": "" },
  { "publisher": "旺文社", "vendor": "きんぶん", "school": "" },
  { "publisher": "啓林館", "vendor": "きんぶん", "school": "" },
  { "publisher": "尚文出版", "vendor": "きんぶん", "school": "" },
  { "publisher": "河合出版", "vendor": "きんぶん", "school": "" },

  // --- 県教 ---
  { "publisher": "三省堂", "vendor": "県教", "school": "" },
  { "publisher": "エミル出版", "vendor": "県教", "school": "" },
  { "publisher": "京都書房", "vendor": "県教", "school": "" },
  { "publisher": "東京書籍", "vendor": "県教", "school": "" },
  { "publisher": "いいずな書店", "vendor": "県教", "school": "" },
  { "publisher": "Z会出版", "vendor": "県教", "school": "" },
  { "publisher": "ベネッセ", "vendor": "県教", "school": "" },
  { "publisher": "ラーンズ", "vendor": "県教", "school": "" },
  { "publisher": "二宮書店", "vendor": "県教", "school": "" },
  { "publisher": "帝国書院", "vendor": "県教", "school": "" },
  { "publisher": "オーム社", "vendor": "県教", "school": "" },
  { "publisher": "実教出版", "vendor": "県教", "school": "" },
  { "publisher": "第一学習社", "vendor": "県教", "school": "" },

  // --- その他 ---
  { "publisher": "駿台文庫", "vendor": "駿台文庫", "school": "" },
  { "publisher": "好学出版", "vendor": "好学出版", "school": "" },
  { "publisher": "育伸社", "vendor": "育伸社", "school": "" },
  { "publisher": "教育開発", "vendor": "教育開発", "school": "" },
  { "publisher": "博洋社", "vendor": "博洋社", "school": "" },
  { "publisher": "エディケーショナルネットワーク", "vendor": "エディケーショナルネットワーク", "school": "" },
  { "publisher": "主婦の友社", "vendor": "日販", "school": "" }
];

/**
 * 半角カタカナを全角に変換するユーティリティ
 */
export const normalizeKatakana = (src: string): string => {
  if (!src) return src;
  const hw = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｯｬｭｮｰﾞﾟ';
  const fw = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォッャュョー゛゜';
  let res = '';
  for (let i = 0; i < src.length; i++) {
    const idx = hw.indexOf(src[i]);
    res += (idx !== -1) ? fw[idx] : src[i];
  }
  res = res.replace(/カ゛/g, 'ガ').replace(/キ゛/g, 'ギ').replace(/ク゛/g, 'グ').replace(/ケ゛/g, 'ゲ').replace(/コ゛/g, 'ゴ')
           .replace(/サ゛/g, 'ザ').replace(/シ゛/g, 'ジ').replace(/ス゛/g, 'ズ').replace(/セ゛/g, 'ゼ').replace(/ソ゛/g, 'ゾ')
           .replace(/タ゛/g, 'ダ').replace(/チ゛/g, 'ヂ').replace(/ツ゛/g, 'ヅ').replace(/テ゛/g, 'デ').replace(/ト゛/g, 'ド')
           .replace(/ハ゛/g, 'バ').replace(/ヒ゛/g, 'ビ').replace(/フ゛/g, 'ブ').replace(/ヘ゛/g, 'ベ').replace(/ボ/g, 'ボ')
           .replace(/ハ゜/g, 'パ').replace(/ヒ゜/g, 'ピ').replace(/フ゜/g, 'プ').replace(/ヘ゜/g, 'ペ').replace(/ホ゜/g, 'ポ')
           .replace(/ウ゛/g, 'ヴ');
  return res;
};
