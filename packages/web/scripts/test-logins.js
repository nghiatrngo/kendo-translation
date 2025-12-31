// Test login flows for all test users via API

async function testLogin(email, password, expectedRole) {
    console.log(`\n=== Testing ${email} ===`);

    try {
        // Step 1: Login
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            console.log(`❌ Login failed: ${await loginRes.text()}`);
            return false;
        }

        console.log(`✅ Login successful`);

        // Extract cookies
        const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
        const cookieHeader = cookies.join('; ');

        if (!cookieHeader) {
            console.log('⚠️ No cookies received from login');
        }

        // Step 2: Check /api/auth/me
        const meRes = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Cookie': cookieHeader }
        });

        if (!meRes.ok) {
            console.log(`❌ /api/auth/me failed: ${meRes.status}`);
            return false;
        }

        const meData = await meRes.json();
        console.log(`  User: ${meData.user ? meData.user.email : 'null'}`);
        console.log(`  Role: ${meData.profile ? meData.profile.role : 'null'}`);

        if (meData.profile && meData.profile.role === expectedRole) {
            console.log(`✅ Role matches expected: ${expectedRole}`);
            return true;
        } else {
            console.log(`❌ Role mismatch. Expected: ${expectedRole}, Got: ${meData.profile?.role || 'null'}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    const results = [];

    results.push(await testLogin('admin-1@test.com', '!12345678!', 'admin'));
    results.push(await testLogin('translator-1@test.com', '!12345678!', 'translator'));
    results.push(await testLogin('reader-1@test.com', '!12345678!', 'reader'));

    console.log('\n=== Summary ===');
    const passed = results.filter(r => r).length;
    console.log(`${passed}/3 tests passed`);
}

main();
