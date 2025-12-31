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

        // Check auth.users
        console.log('=== Auth Users ===');
        const users = await client.query(`
            SELECT id, email, created_at 
            FROM auth.users 
            WHERE email IN ('admin-1@test.com', 'translator-1@test.com', 'reader-1@test.com')
        `);
        console.log(users.rows);

        // Check profiles
        console.log('\n=== Profiles ===');
        const profiles = await client.query(`SELECT * FROM public.profiles`);
        console.log(profiles.rows);

        // If profiles don't exist for test users, create them
        if (users.rows.length > 0 && profiles.rows.length === 0) {
            console.log('\n⚠️ No profiles found. Creating profiles for test users...');
            for (const user of users.rows) {
                const role = user.email.includes('admin') ? 'admin'
                    : user.email.includes('translator') ? 'translator'
                        : 'reader';
                await client.query(`
                    INSERT INTO public.profiles (id, role, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET role = $2
                `, [user.id, role]);
                console.log(`  Created/updated profile for ${user.email} with role ${role}`);
            }
        } else if (profiles.rows.length > 0) {
            // Update roles
            console.log('\n📝 Updating roles for existing profiles...');
            for (const user of users.rows) {
                const role = user.email.includes('admin') ? 'admin'
                    : user.email.includes('translator') ? 'translator'
                        : 'reader';
                await client.query(`
                    UPDATE public.profiles SET role = $1 WHERE id = $2
                `, [role, user.id]);
                console.log(`  Updated ${user.email} to role: ${role}`);
            }
        }

        // Verify final state
        console.log('\n=== Final Profiles ===');
        const finalProfiles = await client.query(`
            SELECT p.id, u.email, p.role, p.created_at 
            FROM public.profiles p
            JOIN auth.users u ON p.id = u.id
        `);
        console.log(finalProfiles.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

main();
