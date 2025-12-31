// Verify profiles directly from database to confirm they exist
const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: 'db.mbgmyvmsvenvtecvrjia.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'zS5Z6M4sSOENjRWS',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Check profiles exist
    console.log('=== All Profiles ===');
    const profiles = await client.query(`
        SELECT p.id, u.email, p.role, p.username
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        ORDER BY u.email
    `);
    profiles.rows.forEach(p => {
        console.log(`  ${p.email}: role="${p.role}", username="${p.username}", id=${p.id}`);
    });

    // Check RLS policies
    console.log('\n=== RLS Policies on profiles ===');
    const policies = await client.query(`
        SELECT policyname, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'profiles'
    `);
    policies.rows.forEach(p => {
        console.log(`  ${p.policyname} (${p.cmd}): ${p.qual}`);
    });

    await client.end();
}

main();
