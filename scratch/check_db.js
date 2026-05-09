
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wgppuphcwvzxdowkdlwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHB1cGhjd3Z6eGRvd2tkbHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI2MDMsImV4cCI6MjA5MTM0ODYwM30.H46bsfmda9S00dlgHuA3pzQhAeJBjr7zLVPJMuac0A0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {

    const { data, error } = await supabase
        .from('textbook_order_items')
        .select('billing_target, textbook_name')
        .limit(10);


    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkData();
