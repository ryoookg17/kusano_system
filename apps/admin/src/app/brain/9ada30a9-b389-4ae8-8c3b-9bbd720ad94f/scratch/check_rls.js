
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function checkRLSStatus() {
  console.log('Checking RLS status for major tables...');
  
  // 通常、anonキーでは設定情報のテーブル（pg_tables等）は見れないことが多いですが
  // 試しに一般的な読み取りが可能かテストします。
  const tables = ['textbook_orders', 'textbook_order_items', 'school_books'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: Access Error - ${error.message}`);
    } else {
      console.log(`Table ${table}: Accessible with anon key (Data count: ${data.length})`);
    }
  }
  
  console.log('\n--- Warning ---');
  console.log('If all tables are accessible without login, it means RLS might be disabled or set to "public".');
  console.log('Supabase is moving towards enforcing RLS by default.');
}

checkRLSStatus();
