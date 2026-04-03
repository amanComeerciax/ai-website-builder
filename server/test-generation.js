/**
 * Test the new Snippet Architecture End-to-End
 */
const { assemble } = require('./services/templateAssembler.js');
const fs = require('fs');
const dotenv = require('dotenv');

// Make sure env is loaded for Anthropic / API keys
dotenv.config({ path: './.env' });

async function runTest() {
  console.log('--- Starting Architecture Verification Test ---');

  const mockSpec = {
    businessName: 'Nexys AI',
    siteType: 'SaaS',
    description: 'A revolutionary AI startup revolutionizing data workflows. Professional, dark-mode, tech-focused.',
    tone: 'Futuristic and sophisticated'
  };

  const onProgress = (data) => {
    console.log(`[Progress] ${data.event}: ${data.message || data.file}`);
  };

  try {
    const result = await assemble(mockSpec, onProgress);
    
    fs.writeFileSync('test-output.html', result.html);
    console.log('\\n✅ Success! Result written to test-output.html');
    console.log('--- Design Tokens Created ---');
    console.log(result.layoutSpec.designTokens);
    console.log('--- Snippets Selected ---');
    console.log(result.layoutSpec.sections.map(s => s.snippetId));
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

runTest();
