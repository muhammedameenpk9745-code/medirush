const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

async function testRegister() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase URL:', supabaseUrl);
  console.log('Anon Key Present:', !!supabaseAnonKey);
  console.log('Service Role Key Present:', !!serviceRoleKey);

  const client = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    console.log('Testing Supabase query...');
    const { data, error } = await client.from('profiles').select('id').limit(1);
    if (error) {
      console.error('Supabase query error:', error);
    } else {
      console.log('Supabase query success! Data:', data);
    }
  } catch (err) {
    console.error('Caught exception during Supabase query:', err);
  }

  try {
    console.log('Testing Resend / OTP service...');
    // test Resend call
    const resendApiKey = process.env.RESEND_API_KEY;
    console.log('RESEND_API_KEY:', resendApiKey);
    if (resendApiKey && resendApiKey.startsWith('re_123456789_placeholder')) {
      console.log('RESEND_API_KEY is placeholder!');
    }
    const { Resend } = require('resend');
    const resend = new Resend(resendApiKey);
    const res = await resend.emails.send({
      from: 'MediRush <onboarding@resend.dev>',
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test',
    });
    console.log('Resend send response:', res);
  } catch (err) {
    console.error('Caught exception during Resend API call:', err);
  }
}

testRegister();
