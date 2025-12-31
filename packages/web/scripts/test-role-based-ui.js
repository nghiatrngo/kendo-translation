// Test role-based UI for all 3 user roles
// Tests navigation visibility and route access

const TEST_USERS = [
    { email: 'admin-1@test.com', password: '!12345678!', role: 'admin' },
    { email: 'translator-1@test.com', password: '!12345678!', role: 'translator' },
    { email: 'reader-1@test.com', password: '!12345678!', role: 'reader' },
];

const PROTECTED_ROUTES = {
    admin: ['/admin'],
    translator: ['/translate'],
    all: ['/dashboard', '/bookmarks'],
};

async function testRoleBasedAccess(user) {
    console.log(`\n=== Testing ${user.role.toUpperCase()} (${user.email}) ===`);

    // Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
    });

    if (!loginRes.ok) {
        console.log(`❌ Login failed for ${user.email}`);
        return;
    }

    const cookies = loginRes.headers.getSetCookie
        ? loginRes.headers.getSetCookie().join('; ')
        : '';
    console.log(`✅ Logged in`);

    // Test /api/auth/me for role
    const meRes = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Cookie': cookies },
    });
    const meData = await meRes.json();
    console.log(`  Role from API: ${meData.profile?.role}`);

    if (meData.profile?.role !== user.role) {
        console.log(`❌ Role mismatch! Expected ${user.role}, got ${meData.profile?.role}`);
    }

    // Test accessing protected routes
    console.log('\n  Testing protected routes:');

    // Admin-only route
    const adminRes = await fetch('http://localhost:3000/admin', {
        headers: { 'Cookie': cookies },
        redirect: 'manual',
    });
    if (user.role === 'admin') {
        console.log(`  /admin: ${adminRes.status === 200 ? '✅ Accessible' : '❌ Should be accessible'}`);
    } else {
        console.log(`  /admin: ${adminRes.status === 307 || adminRes.status === 302 ? '✅ Redirected (correct)' : `❌ Status ${adminRes.status}`}`);
    }

    // Translate route
    const translateRes = await fetch('http://localhost:3000/translate', {
        headers: { 'Cookie': cookies },
        redirect: 'manual',
    });
    if (user.role === 'admin' || user.role === 'translator') {
        console.log(`  /translate: ${translateRes.status === 200 ? '✅ Accessible' : '❌ Should be accessible'}`);
    } else {
        console.log(`  /translate: ${translateRes.status === 307 || translateRes.status === 302 ? '✅ Redirected (correct)' : `❌ Status ${translateRes.status}`}`);
    }

    // Dashboard (all authenticated users)
    const dashRes = await fetch('http://localhost:3000/dashboard', {
        headers: { 'Cookie': cookies },
        redirect: 'manual',
    });
    console.log(`  /dashboard: ${dashRes.status === 200 ? '✅ Accessible' : `❌ Status ${dashRes.status}`}`);

    // Logout
    await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Cookie': cookies },
    });
    console.log(`\n  Logged out`);
}

async function main() {
    console.log('=== Role-Based UI E2E Test ===\n');
    console.log('Test Users:');
    TEST_USERS.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    for (const user of TEST_USERS) {
        await testRoleBasedAccess(user);
    }

    console.log('\n=== Test Complete ===');
}

main();
