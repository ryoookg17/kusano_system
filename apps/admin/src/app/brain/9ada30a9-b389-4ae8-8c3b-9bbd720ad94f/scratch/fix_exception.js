
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function fixYamakawaException() {
  console.log('Checking for Yamakawa + Keiho (any variant) exceptions...');
  
  // 瓊浦を含む注文IDを取得
  const { data: orders, error: orderError } = await supabase
    .from('textbook_orders')
    .select('id, school_name')
    .ilike('school_name', '%瓊浦%');

  if (orderError) {
    console.error(orderError);
    return;
  }

  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) {
    console.log('No orders found for Keiho.');
    return;
  }

  console.log(`Checking items for ${orders.length} orders...`);

  // それらの注文に紐づく山川出版社のアイテムを取得
  const { data: items, error: itemError } = await supabase
    .from('textbook_order_items')
    .select('id, publisher, accounting_vendor')
    .in('order_id', orderIds)
    .ilike('publisher', '%山川%');

  if (itemError) {
    console.error(itemError);
    return;
  }

  console.log(`Found ${items.length} Yamakawa items in Keiho orders.`);

  let fixCount = 0;
  for (const item of items) {
    if (item.accounting_vendor !== '県教') {
      const { error: updateError } = await supabase
        .from('textbook_order_items')
        .update({ accounting_vendor: '県教' })
        .eq('id', item.id);
      
      if (!updateError) fixCount++;
    }
  }

  console.log(`Fixed ${fixCount} items.`);
}

fixYamakawaException();
