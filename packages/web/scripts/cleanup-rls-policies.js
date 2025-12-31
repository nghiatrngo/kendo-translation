// Drop the old duplicate RLS policies that still cause recursion issues
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
    console.log('Connected. Cleaning up duplicate RLS policies...');

    // Drop old duplicate policies with recursive queries
    const policiesToDrop = [
        'Admins can view all profiles',
        'Admins can update all profiles'
    ];

    for (const policy of policiesToDrop) {
        try {
            await client.query(`DROP POLICY IF EXISTS "${policy}" ON profiles`);
            console.log(`✅ Dropped: ${policy}`);
        } catch (error) {
            console.log(`⚠️ Could not drop ${policy}: ${error.message}`);
        }
    }

    // Verify final policies
    console.log('\n=== Final RLS Policies on profiles ===');
    const policies = await client.query(`
        SELECT policyname, cmd
        FROM pg_policies 
        WHERE tablename = 'profiles'
    `);
    policies.rows.forEach(p => {
        console.log(`  ${p.policyname} (${p.cmd})`);
    });

    await client.end();
}

main();
