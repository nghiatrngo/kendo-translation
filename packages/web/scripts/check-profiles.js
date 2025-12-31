// Script to update user roles via Supabase REST API
// Uses SUPABASE_URL and SUPABASE_ANON_KEY from environment

const SUPABASE_URL = 'https://mbgmyvmsvenvtecvrjia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZ215dm1zdmVudnRlY3ZyamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTgxODIsImV4cCI6MjA4MjY5NDE4Mn0.On09JvJlQ9BsNcRXQE06wyUlxrGtECwO1sVVMdvzpD0';

// Unfortunately, we cannot directly update profiles via anon key due to RLS
// The service_role key is needed for this. However, we can check current profile data.

async function main() {
    console.log('Checking profiles table...');

    // List all profiles
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (res.ok) {
        const profiles = await res.json();
        console.log('Current profiles:');
        profiles.forEach(p => {
            console.log(`  - ${p.id}: ${p.email || '(no email)'}, role: ${p.role}`);
        });
    } else {
        console.error('Error fetching profiles:', await res.text());
    }
}

main();
