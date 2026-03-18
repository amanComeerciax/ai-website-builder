async function test() {
    console.log("1. Creating Project...");
    const pReq = await fetch('http://localhost:5000/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test Hydration App' }) });
    const pRes = await pReq.json();
    const projectId = pRes.project._id;
    console.log("Project created:", projectId);

    console.log("\n2. Sending Prompt to /api/generate...");
    const gReq = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt: "Make a simple landing page", existingFiles: {} })
    });
    const gRes = await gReq.json();
    console.log("Generation started:", gRes);

    await new Promise(r => setTimeout(r, 1000));

    console.log("\n3. Testing Hydration Endpoint GET /api/projects/:id...");
    const hReq = await fetch(`http://localhost:5000/api/projects/${projectId}`);
    const hRes = await hReq.json();
    console.log("Hydration returned Project:", hRes?.project?.name);
    console.log("Hydration returned Messages (Count):", hRes?.messages?.length);
    if(hRes.messages) {
        hRes.messages.forEach(m => console.log(`  - Role: ${m.role} | Status: ${m.status} | Content: ${m.content.substring(0, 30)}...`));
    }
}
test().catch(console.error);
