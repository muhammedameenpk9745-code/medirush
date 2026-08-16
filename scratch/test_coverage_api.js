const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStores() {
  console.log('=== TESTING SELLER DELIVERY COVERAGE SYSTEM ===');
  const { data: stores, error } = await supabase.from('medical_stores').select('id, store_name, city, state, pincode').limit(3);
  
  if (error) {
    console.error('Supabase query error:', error);
    return;
  }

  console.log('Stores found in database:', stores);

  if (stores && stores.length > 0) {
    const sId = stores[0].id;
    const checkRes = await fetch('http://localhost:3000/api/location/check-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeIds: [sId],
        customerAddress: {
          district: 'Malappuram',
          state: 'Kerala',
          country: 'India',
          pincode: '679338',
          latitude: 11.0428,
          longitude: 76.0807
        }
      })
    });
    const result = await checkRes.json();
    console.log('Delivery Coverage Result for Store', stores[0].store_name, ':', JSON.stringify(result, null, 2));
  }
}

checkStores();
