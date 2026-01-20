const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const users = [
  { email: 'admin-1@test.com', id: '17fb4e26-d477-4d86-b52f-6938c75e4f7b' },
  { email: 'translator-1@test.com', id: 'c1819905-dbf2-41d3-b67b-34cb2bcf3733' },
  { email: 'reader-1@test.com', id: '4f436df4-6841-4adc-95fd-93f6b2c2c45d' }
];

async function resetAll() {
  for (const user of users) {
    console.log('Resetting password for:', user.email);
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: 'test-password' }
    );
    if (error) {
      console.error('Failed:', error.message);
    } else {
      console.log('Success.');
    }
  }
}

resetAll();
