/**
 * Routing Logic Test
 * 
 * Verifies that callModel:
 * 1. Defaults to Mistral
 * 2. Falls back to Qwen if Mistral fails
 * 3. Falls back to Groq if Qwen also fails
 */
require('dotenv').config();
const { callModel, ROUTING_TABLE } = require('./services/modelRouter.js');

// Mocking the specific service calls to simulate failures
const mistralService = require('./services/mistralService.js');
const qwenService = require('./services/qwenService.js');
const groqService = require('./services/groqService.js');

async function testRouting() {
    console.log('=== START ROUTING TESTS ===\n');

    // TEST 1: Normal Mistral Success
    console.log('TEST 1: Mistral Success...');
    const originalCallMistral = mistralService.callMistral;
    mistralService.callMistral = async () => ({ content: 'Mistral Success', model: 'mistral' });
    
    try {
        const res = await callModel('generate_html', 'test prompt', 'system');
        console.log(`  Result Model: ${res.model}`);
        console.log(`  Fallback Used: ${res.fallbackUsed}`);
        if (res.model === 'mistral' && !res.fallbackUsed) {
            console.log('  ✅ PASS');
        } else {
            console.log('  ❌ FAIL');
        }
    } catch (e) {
        console.error('  ❌ ERROR:', e.message);
    }

    // TEST 2: Mistral Fail -> Qwen Success
    console.log('\nTEST 2: Mistral Fail -> Qwen Success...');
    mistralService.callMistral = async () => { throw new Error('Mistral Down'); };
    const originalGenerateWithQwen = qwenService.generateWithQwen;
    qwenService.generateWithQwen = async () => 'Qwen Success';

    try {
        const res = await callModel('generate_html', 'test prompt', 'system');
        console.log(`  Result Model: ${res.model}`);
        console.log(`  Fallback Used: ${res.fallbackUsed}`);
        if (res.model === 'qwen' && res.fallbackUsed) {
            console.log('  ✅ PASS');
        } else {
            console.log('  ❌ FAIL');
        }
    } catch (e) {
        console.error('  ❌ ERROR:', e.message);
    }

    // TEST 3: Mistral Fail -> Qwen Fail -> Groq Success
    console.log('\nTEST 3: Mistral Fail -> Qwen Fail -> Groq Success...');
    qwenService.generateWithQwen = async () => { throw new Error('Ollama Down'); };
    const originalCallGroq = groqService.callGroq;
    groqService.callGroq = async () => ({ content: 'Groq Success', model: 'groq' });

    try {
        const res = await callModel('generate_html', 'test prompt', 'system');
        console.log(`  Result Model: ${res.model}`);
        console.log(`  Fallback Used: ${res.fallbackUsed}`);
        if (res.model === 'groq' && res.fallbackUsed) {
            console.log('  ✅ PASS');
        } else {
            console.log('  ❌ FAIL');
        }
    } catch (e) {
        console.error('  ❌ ERROR:', e.message);
    }

    // Restore original functions
    mistralService.callMistral = originalCallMistral;
    qwenService.generateWithQwen = originalGenerateWithQwen;
    groqService.callGroq = originalCallGroq;

    console.log('\n=== ROUTING TESTS COMPLETE ===');
}

testRouting();
