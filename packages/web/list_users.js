const { createClient } = require('@supabase/supabase-js');

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Unset');
console.log('Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Unset');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  console.log('Fetching users...');
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Users found:', data.users.length);
  data.users.forEach(u => console.log(u.email + ': ' + u.id));
}

listUsers();
