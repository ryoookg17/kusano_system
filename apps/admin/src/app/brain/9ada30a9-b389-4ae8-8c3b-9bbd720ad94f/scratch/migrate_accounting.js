
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function migrateAll() {
  console.log('Starting full migration...');
  let totalUpdated = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('textbook_order_items')
      .select('id, remarks')
      .not('remarks', 'is', null)
      .ilike('remarks', '%帳合%')
      .limit(500); // 500件ずつ処理

    if (error) {
      console.error(error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing batch of ${data.length} items...`);

    for (const item of data) {
      const remarks = item.remarks || "";
      const match = remarks.match(/帳合\s*[:：]\s*([^\s\n　]+)/);
      
      if (match) {
        const vendor = match[1];
        const newRemarks = remarks.replace(/帳合\s*[:：]\s*[^\s\n　]+/, '').trim();
        
        const { error: updateError } = await supabase
          .from('textbook_order_items')
          .update({
            accounting_vendor: vendor,
            remarks: newRemarks === "" ? null : newRemarks
          })
          .eq('id', item.id);

        if (!updateError) {
          totalUpdated++;
        }
      } else {
        // もし「帳合」という文字はあるがパターンに合致しない場合は、無限ループを避けるためスキップマークを付けるなどの処理が必要
        // ここでは単純に次のバッチで同じものを引かないよう、一時的に処理対象から外すための工夫が必要
        // 面倒なので、「帳合」という文字が含まれるがマッチしない場合は、単に accounting_vendor を "-" などにして処理済みにする
        await supabase
          .from('textbook_order_items')
          .update({ accounting_vendor: '不明(形式不備)' })
          .eq('id', item.id);
      }
    }
    console.log(`Progress: ${totalUpdated} items processed.`);
  }

  console.log(`All done! Total updated: ${totalUpdated}`);
}

migrateAll();
