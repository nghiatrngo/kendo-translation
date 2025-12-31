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

    try {
        await client.connect();
        console.log('Connected. Creating profiles for test users...');

        // Get all test users
        const users = await client.query(`
            SELECT id, email FROM auth.users 
            WHERE email IN ('admin-1@test.com', 'translator-1@test.com', 'reader-1@test.com')
        `);

        for (const user of users.rows) {
            const role = user.email.includes('admin') ? 'admin'
                : user.email.includes('translator') ? 'translator'
                    : 'reader';

            await client.query(`
                INSERT INTO public.profiles (id, username, role, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET role = $3, updated_at = NOW()
            `, [user.id, user.email.split('@')[0], role]);

            console.log(`✅ Created/updated profile for ${user.email} with role: ${role}`);
        }

        // Verify
        console.log('\n=== Final Profiles ===');
        const profiles = await client.query(`
            SELECT p.id, u.email, p.role, p.username
            FROM public.profiles p
            JOIN auth.users u ON p.id = u.id
            ORDER BY u.email
        `);
        profiles.rows.forEach(p => {
            console.log(`  ${p.email}: ${p.role} (${p.username})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

main();
