
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for listing users

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function listUsers() {
  console.log('Listing users...')
  
  // Method 1: Get from auth.users (requires service role)
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  // Method 2: Get from public.profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')

  if (profileError) {
      console.error('Error fetching profiles:', profileError)
  }

  console.log('\n--- Active Accounts ---')
  console.table(users.map(u => {
      const profile = profiles?.find(p => p.id === u.id)
      return {
          id: u.id,
          email: u.email,
          role: profile?.role || 'N/A',
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at
      }
  }))
}

listUsers()
