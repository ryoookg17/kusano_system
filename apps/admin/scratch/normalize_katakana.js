const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://wgppuphcwvzxdowkdlwf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0');

const h2f = (src) => {
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

async function main() {
  const { data: rows, error } = await s.from('textbook_order_items').select('*');
  if (error) {
    console.error(error);
    return;
  }

  let count = 0;
  for (const row of rows) {
    const nextPub = h2f(row.publisher);
    const nextName = h2f(row.textbook_name);
    const nextVendor = h2f(row.accounting_vendor);
    if (nextPub !== row.publisher || nextName !== row.textbook_name || nextVendor !== row.accounting_vendor) {
      const { error: updateError } = await s.from('textbook_order_items')
        .update({
          publisher: nextPub,
          textbook_name: nextName,
          accounting_vendor: nextVendor
        })
        .eq('id', row.id);
      if (!updateError) count++;
    }
  }
  console.log(`Converted ${count} items to full-width`);
}

main();
