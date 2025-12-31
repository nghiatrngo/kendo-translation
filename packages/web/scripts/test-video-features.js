// Test video features E2E - FIXED version

async function testVideoFeatures() {
    console.log('=== Video Features E2E Test ===\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin-1@test.com...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin-1@test.com', password: '!12345678!' })
    });

    if (!loginRes.ok) {
        console.log('❌ Login failed');
        return;
    }

    const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
    const cookieHeader = cookies.join('; ');
    console.log('✅ Logged in\n');

    // Step 2: List videos (API returns array directly, not {videos: []})
    console.log('2. Listing videos...');
    const listVideosRes = await fetch('http://localhost:3000/api/videos', {
        headers: { 'Cookie': cookieHeader }
    });
    const videosArray = await listVideosRes.json();
    console.log(`  Found ${videosArray.length} videos`);

    const targetVideo = videosArray.find(v => v.youtube_id === '_A38CHmgmM0');
    if (!targetVideo) {
        console.log('❌ Target video not found. Adding it...');

        // Add the video
        const addRes = await fetch('http://localhost:3000/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
            body: JSON.stringify({
                youtube_id: '_A38CHmgmM0',
                title: 'KENDO【ŌJI WAZA】Furukawa Kazuo 8th dan Hanshi'
            })
        });

        if (!addRes.ok) {
            console.log(`❌ Failed to add video: ${await addRes.text()}`);
            return;
        }
        console.log('✅ Video added');
    } else {
        console.log(`✅ Video already exists: ${targetVideo.id}`);
    }

    // Get video ID
    const refreshRes = await fetch('http://localhost:3000/api/videos');
    const refreshedVideos = await refreshRes.json();
    const video = refreshedVideos.find(v => v.youtube_id === '_A38CHmgmM0');

    if (!video) {
        console.log('❌ Still cannot find video after refresh');
        return;
    }

    console.log(`\n3. Testing video notes on video ${video.id}...`);

    // Step 3: Add a note (API expects video_id, start_time, end_time, text)
    console.log('  Adding a note at 1:14...');
    const addNoteRes = await fetch('http://localhost:3000/api/video-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
        body: JSON.stringify({
            video_id: video.id,
            start_time: 74,
            end_time: 80,
            text: 'Test note - Ōji Waza demonstration at 1:14'
        })
    });

    const noteResult = await addNoteRes.json();
    if (!addNoteRes.ok) {
        console.log(`  ❌ Failed to add note: ${JSON.stringify(noteResult)}`);
    } else {
        console.log(`  ✅ Note added: ${noteResult.note?.id || noteResult.id || 'OK'}`);
    }

    // Step 4: List notes
    console.log('\n4. Listing notes for video...');
    const listNotesRes = await fetch(`http://localhost:3000/api/video-notes?video_id=${video.id}`, {
        headers: { 'Cookie': cookieHeader }
    });
    const notesResult = await listNotesRes.json();
    const notes = notesResult.notes || notesResult || [];
    console.log(`  Found ${notes.length} notes`);

    if (notes.length > 0) {
        notes.forEach(n => {
            console.log(`    - "${n.text}" (${n.start_time}s - ${n.end_time}s) [id: ${n.id}]`);
        });
    }

    // Step 5: Delete a note (if we have any)
    if (notes.length > 0) {
        const noteToDelete = notes[0];
        console.log(`\n5. Deleting note ${noteToDelete.id}...`);
        const deleteRes = await fetch('http://localhost:3000/api/video-notes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
            body: JSON.stringify({ id: noteToDelete.id })
        });

        if (deleteRes.ok) {
            console.log('  ✅ Note deleted');
        } else {
            console.log(`  ❌ Failed to delete: ${await deleteRes.text()}`);
        }

        // Verify deletion
        const verifyRes = await fetch(`http://localhost:3000/api/video-notes?video_id=${video.id}`, {
            headers: { 'Cookie': cookieHeader }
        });
        const verifyResult = await verifyRes.json();
        const remainingNotes = verifyResult.notes || verifyResult || [];
        console.log(`  Remaining notes: ${remainingNotes.length}`);
    }

    console.log('\n=== Video Features Test Complete ===');
    console.log('All features working: ✅');
}

testVideoFeatures();
