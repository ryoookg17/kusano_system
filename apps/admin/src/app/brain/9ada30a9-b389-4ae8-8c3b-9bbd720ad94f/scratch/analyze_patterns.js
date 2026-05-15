
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function analyzePatterns() {
  const { data, error } = await supabase
    .from('textbook_order_items')
    .select('publisher, accounting_vendor')
    .not('accounting_vendor', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  const patterns = {};

  data.forEach(item => {
    const pub = item.publisher || '不明';
    const vendor = item.accounting_vendor;
    
    if (!patterns[pub]) patterns[pub] = {};
    if (!patterns[pub][vendor]) patterns[pub][vendor] = 0;
    patterns[pub][vendor]++;
  });

  console.log('--- Publisher to Accounting Vendor Patterns ---');
  // 出版社ごとに、最も多い帳合を表示
  Object.keys(patterns).sort().forEach(pub => {
    const vendors = Object.entries(patterns[pub])
      .sort((a, b) => b[1] - a[1]);
    
    const topVendor = vendors[0];
    console.log(`${pub.padEnd(20)} -> ${topVendor[0]} (${topVendor[1]}件)`);
  });
}

analyzePatterns();
