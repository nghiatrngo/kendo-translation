// Fix RLS for video_notes table - correct SQL syntax
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
    console.log('Connected. Fixing video_notes RLS...');

    // Drop existing policies and recreate properly
    const policiesToManage = [
        { name: 'Users can insert own notes', cmd: 'INSERT', check: 'auth.uid() = user_id' },
        { name: 'Users can view own notes', cmd: 'SELECT', check: 'auth.uid() = user_id' },
        { name: 'Users can delete own notes', cmd: 'DELETE', check: 'auth.uid() = user_id' },
        { name: 'Users can update own notes', cmd: 'UPDATE', check: 'auth.uid() = user_id' },
    ];

    for (const policy of policiesToManage) {
        // Drop if exists
        await client.query(`DROP POLICY IF EXISTS "${policy.name}" ON public.video_notes`);

        // Create new policy
        let sql;
        if (policy.cmd === 'INSERT') {
            sql = `CREATE POLICY "${policy.name}" ON public.video_notes FOR ${policy.cmd} TO authenticated WITH CHECK (${policy.check})`;
        } else if (policy.cmd === 'SELECT' || policy.cmd === 'DELETE') {
            sql = `CREATE POLICY "${policy.name}" ON public.video_notes FOR ${policy.cmd} TO authenticated USING (${policy.check})`;
        } else {
            sql = `CREATE POLICY "${policy.name}" ON public.video_notes FOR ${policy.cmd} TO authenticated USING (${policy.check}) WITH CHECK (${policy.check})`;
        }

        try {
            await client.query(sql);
            console.log(`✅ Created: ${policy.name}`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    // Verify final state
    console.log('\n=== Final video_notes policies ===');
    const finalPolicies = await client.query(`
        SELECT policyname, cmd FROM pg_policies WHERE tablename = 'video_notes'
    `);
    finalPolicies.rows.forEach(p => console.log(`  ${p.policyname} (${p.cmd})`));

    await client.end();
}

main();
