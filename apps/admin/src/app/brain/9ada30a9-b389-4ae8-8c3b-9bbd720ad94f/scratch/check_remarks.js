
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function checkRemarks() {
  const { data, error } = await supabase
    .from('textbook_order_items')
    .select('id, remarks, textbook_name')
    .not('remarks', 'is', null)
    .limit(50);

  if (error) {
    console.error(error);
    return;
  }

  console.log('--- Remarks Data Check ---');
  data.forEach(item => {
    if (item.remarks.trim()) {
      console.log(`ID: ${item.id} | Textbook: ${item.textbook_name} | Remarks: "${item.remarks}"`);
    }
  });
}

checkRemarks();
