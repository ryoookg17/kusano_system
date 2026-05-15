const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});

async function run() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/textbook_order_items?select=main_item_type,answer_type,delivery_method&limit=5&order=created_at.desc';
  const headers = {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
