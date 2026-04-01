const { assemble } = require('./server/services/templateAssembler.js');
const { enhance } = require('./server/services/promptEnhancer.js');

async function test() {
  console.log('\n--- TEST 1: Coffee Shop (Warm Colors) ---');
  const prompt1 = 'A cozy artisanal coffee shop with a warm atmosphere';

  try {
    const { enrichedSpec: spec1 } = await enhance(prompt1, { websiteName: 'Bean & Brew' });
    console.log('AI Suggested Colors:', spec1.brandColors);
    const res1 = await assemble(spec1, (p) => {});
    console.log('✅ Coffee Shop Generated');
    console.log('Accent Color in HTML:', res1.files['index.html'].match(/--color-accent:\s*(#[0-9a-fA-F]+)/)?.[1]);
    console.log('Sections:', res1.layoutSpec.sections.map(s => `${s.component}(${s.variant})`));
  } catch (e) { console.error('Test 1 failed:', e); }

  console.log('\n--- TEST 2: AI Agency (Premium Variants) ---');
  const prompt2 = 'A futuristic AI automation agency for enterprise clients';

  try {
    const { enrichedSpec: spec2 } = await enhance(prompt2, { websiteName: 'NeuroSync AI', theme: 'premium-dark' });
    console.log('AI Suggested Colors:', spec2.brandColors);
    const res2 = await assemble(spec2, (p) => {});
    console.log('✅ AI Agency Generated');
    console.log('Accent Color in HTML:', res2.files['index.html'].match(/--color-accent:\s*(#[0-9a-fA-F]+)/)?.[1]);
    console.log('Sections:', res2.layoutSpec.sections.map(s => `${s.component}(${s.variant})`));
  } catch (e) { console.error('Test 2 failed:', e); }
}

test();
