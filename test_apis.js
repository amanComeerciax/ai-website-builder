require('/Users/commerciax-fs-1/Desktop/ai-website-builder/server/node_modules/dotenv').config({ path: '/Users/commerciax-fs-1/Desktop/ai-website-builder/server/.env' });
const { callMistral } = require('./server/services/mistralService.js');
const { callGroq } = require('./server/services/groqService.js');

async function test() {
  console.log('--- Testing Mistral ---');
  try {
    const m = await callMistral('Hi', 'Hello', { temperature: 0.1 });
    console.log('Mistral OK:', m.content.substring(0, 20));
  } catch (e) {
    console.error('Mistral FAILED:', e.message);
  }

  console.log('\n--- Testing Groq ---');
  try {
    const g = await callGroq('Hi', 'Hello', { temperature: 0.1 });
    console.log('Groq OK:', g.content.substring(0, 20));
  } catch (e) {
    console.error('Groq FAILED:', e.message);
  }
}

test();
