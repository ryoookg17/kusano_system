
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgppuphcwvzxdowkdlwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0'
);

async function checkSchoolName() {
  const { data, error } = await supabase
    .from('textbook_orders')
    .select('school_name')
    .ilike('school_name', '%瓊浦%')
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log('--- School Name in DB ---');
  data.forEach(d => console.log(`"${d.school_name}"`));
}

checkSchoolName();
