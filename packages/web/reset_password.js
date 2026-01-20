require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPassword() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '17fb4e26-d477-4d86-b52f-6938c75e4f7b', // ID for admin-1@test.com from previous logs
    { password: 'test-password' }
  );

  if (error) {
    console.error('Error resetting password:', error);
  } else {
    console.log('Password reset successfully for:', data.user.email);
  }
}

resetPassword();
