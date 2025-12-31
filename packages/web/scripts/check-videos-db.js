// Check videos table directly via DB
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

    // Check videos
    console.log('=== Videos ===');
    const videos = await client.query('SELECT * FROM public.videos');
    console.log(`Found ${videos.rows.length} videos`);
    videos.rows.forEach(v => {
        console.log(`  ${v.id}: ${v.title} (${v.youtube_id})`);
    });

    // Check RLS policies on videos
    console.log('\n=== RLS Policies on videos ===');
    const policies = await client.query(`
        SELECT policyname, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'videos'
    `);
    if (policies.rows.length === 0) {
        console.log('  No policies found (RLS might be disabled or allow all)');
    } else {
        policies.rows.forEach(p => {
            console.log(`  ${p.policyname} (${p.cmd}): ${p.qual || 'true'}`);
        });
    }

    // Check if RLS is enabled
    console.log('\n=== RLS Status ===');
    const rlsStatus = await client.query(`
        SELECT relrowsecurity, relname
        FROM pg_class
        WHERE relname = 'videos'
    `);
    console.log(`  videos table RLS enabled: ${rlsStatus.rows[0]?.relrowsecurity}`);

    await client.end();
}

main();
