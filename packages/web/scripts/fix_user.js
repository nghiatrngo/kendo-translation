const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://postgres:zS5Z6M4sSOENjRWS@db.mbgmyvmsvenvtecvrjia.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function fixUser() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const email = 'testuser@example.com';

        // 1. Confirm User in auth.users
        const confirmRes = await client.query(`
      UPDATE auth.users
      SET email_confirmed_at = NOW(), updated_at = NOW(), last_sign_in_at = NOW()
      WHERE email = $1
      RETURNING id;
    `, [email]);

        if (confirmRes.rowCount === 0) {
            console.log('User not found in auth.users. Cannot fix.');
            return;
        }

        const userId = confirmRes.rows[0].id;
        console.log(`User confirmed. ID: ${userId}`);

        // 2. Update Role in public.profiles
        // Check if profile exists
        const profileCheck = await client.query(`
      SELECT * FROM public.profiles WHERE id = $1
    `, [userId]);

        if (profileCheck.rowCount === 0) {
            console.log('Profile not found, creating...');
            await client.query(`
        INSERT INTO public.profiles (id, email, role, username)
        VALUES ($1, $2, 'translator', 'Test User')
      `, [userId, email]);
        } else {
            console.log('Profile exists, updating role...');
            await client.query(`
        UPDATE public.profiles
        SET role = 'translator'
        WHERE id = $1
      `, [userId]);
        }

        console.log('User role updated to translator.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fixUser();
