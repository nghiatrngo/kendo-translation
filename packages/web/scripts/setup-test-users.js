// Native fetch is available in Node 18+

// Helper to signup a user
async function signupUser(email, password) {
    console.log(`Signing up ${email}...`);
    try {
        const res = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            console.log('Response (text):', text);
            data = { error: text };
        }

        if (res.ok) {
            console.log(`✅ Success: ${email}`);
        } else {
            // If user already exists, that's fine for our test
            if (data.error && data.error.includes('User already registered')) {
                console.log(`ℹ️ User ${email} already exists.`);
            } else {
                console.error(`❌ Failed: ${data.error || res.statusText}`);
            }
        }
    } catch (error) {
        console.error(`Error signing up ${email}:`, error);
    }
}

async function main() {
    await signupUser('admin-1@test.com', '!12345678!');
    await signupUser('translator-1@test.com', '!12345678!');
    // Reader user already exists
}

main();
