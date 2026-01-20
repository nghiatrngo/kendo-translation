const { createClient } = require('@supabase/supabase-js');

// Use env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use Anon key for login

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLogin() {
  const email = 'admin-1@test.com';
  const password = 'test-password';
  
  console.log(`Attempting login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Login Failed:', error.message);
  } else {
    console.log('Login Success!');
    console.log('User ID:', data.user.id);
  }
}

verifyLogin();
