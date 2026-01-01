const { Client } = require('pg');

const PROJECT_REF = 'mbgmyvmsvenvtecvrjia';
const DB_PASSWORD = 'zS5Z6M4sSOENjRWS';
// Constructing connection string for direct connection
// Using typical Supabase direct connection format: postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres
const CONNECTION_STRING = `postgres://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

const TARGET_EMAIL = 'testuser@example.com';

async function main() {
    console.log(`Connecting to database for project: ${PROJECT_REF}...`);
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected successfully.');

        // 1. Check if user exists
        const userRes = await client.query('SELECT id, email, email_confirmed_at, raw_user_meta_data FROM auth.users WHERE email = $1', [TARGET_EMAIL]);

        if (userRes.rows.length === 0) {
            console.error(`User ${TARGET_EMAIL} not found! Please create the user via the Signup UI first.`);
            process.exit(1);
        }

        const user = userRes.rows[0];
        console.log(`Found user: ${user.id}`);

        // 2. Confirm Email if needed
        if (!user.email_confirmed_at) {
            console.log('User email not confirmed. Confirming now...');
            await client.query('UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1', [user.id]);
            console.log('Email marked as confirmed.');
        } else {
            console.log('User email already confirmed.');
        }

        // 3. Update/Assign Role in profiles
        console.log('Checking user profile role...');
        // Note: profiles table is in public schema. 
        // We assume a profile row exists because of the trigger, but if not we might need to create it.
        const profileRes = await client.query('SELECT * FROM public.profiles WHERE id = $1', [user.id]);

        if (profileRes.rows.length === 0) {
            console.log('Profile not found. Creating profile...');
            await client.query("INSERT INTO public.profiles (id, username, role) VALUES ($1, $2, 'translator')", [user.id, 'Test User']);
            console.log('Profile created with translator role.');
        } else {
            const profile = profileRes.rows[0];
            if (profile.role !== 'translator') {
                console.log(`Current role is '${profile.role}'. Updating to 'translator'...`);
                await client.query("UPDATE public.profiles SET role = 'translator' WHERE id = $1", [user.id]);
                console.log('Role updated.');
            } else {
                console.log('User already has translator role.');
            }
        }

        console.log('✅ User setup complete. You can now login.');

    } catch (err) {
        console.error('Error executing script:', err);
    } finally {
        await client.end();
    }
}

main();
