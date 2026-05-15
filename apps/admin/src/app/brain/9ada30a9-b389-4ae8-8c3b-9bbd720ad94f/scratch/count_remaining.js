
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function countRemaining() {
  const { count, error } = await supabase
    .from('textbook_order_items')
    .select('*', { count: 'exact', head: true })
    .not('remarks', 'is', null)
    .ilike('remarks', '%帳合%');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Remaining items with "帳合" in remarks: ${count}`);
}

countRemaining();
