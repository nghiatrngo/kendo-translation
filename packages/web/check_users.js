const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('No users found in this project.');
    return;
  }

  console.log('Found users:');
  users.forEach(u => {
    console.log(`${u.email} : ${u.id}`);
  });
}

listUsers();
