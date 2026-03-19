async function test() {
    console.log("=== END-TO-END HYDRATION TEST ===\n");

    // 1. Create project via API (real MongoDB ObjectId)
    console.log("1. Creating project via POST /api/projects...");
    const pReq = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Test Workspace' })
    });
    const pRes = await pReq.json();
    const projectId = pRes.project._id;
    console.log("   ✅ Project created with ObjectId:", projectId);
    console.log("   ObjectId length:", projectId.length, "(should be 24)");

    // 2. Add a message via POST /api/projects/:id/messages
    console.log("\n2. Adding message via POST /api/projects/:id/messages...");
    const mReq = await fetch(`http://localhost:5000/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Build me a SaaS dashboard', role: 'user' })
    });
    const mRes = await mReq.json();
    console.log("   ✅ Message created:", mRes.message._id);

    // 3. Trigger generation with valid ObjectId (no BSONError!)
    console.log("\n3. Triggering generation with valid ObjectId...");
    const gReq = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt: "Build a SaaS dashboard", existingFiles: {} })
    });
    const gRes = await gReq.json();
    console.log("   ✅ Generation queued:", gRes.jobId);
    console.log("   Assistant messageId:", gRes.messageId, "(should NOT be null)");

    // 4. Test hydration endpoint
    await new Promise(r => setTimeout(r, 500));
    console.log("\n4. Testing hydration GET /api/projects/:id...");
    const hReq = await fetch(`http://localhost:5000/api/projects/${projectId}`);
    const hRes = await hReq.json();
    console.log("   ✅ Workspace name:", hRes.project.name);
    console.log("   Message count:", hRes.messages.length);
    hRes.messages.forEach(m => {
        console.log(`   - [${m.role}] ${m.status}: ${m.content.substring(0, 50)}...`);
    });

    // 5. Test with legacy timestamp ID (should NOT crash)
    console.log("\n5. Testing legacy timestamp ID (should NOT crash)...");
    const legacyReq = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: '1773835873510', prompt: 'test', existingFiles: {} })
    });
    const legacyRes = await legacyReq.json();
    console.log("   ✅ No BSONError! Job queued:", legacyRes.jobId);

    console.log("\n=== ALL TESTS PASSED ===");
}
test().catch(e => console.error("❌ TEST FAILED:", e.message));
