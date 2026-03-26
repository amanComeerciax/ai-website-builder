const { buildTrackAPrompt } = require('./server/utils/promptBuilder');
const { getRulesForPhase } = require('./server/utils/ruleLoader');

async function verify() {
  console.log('=== VERIFYING IMAGE SUPPORT ===\n');

  const sitePlan = {
    siteType: 'coffee shop',
    businessName: 'The Daily Bean',
    sections: ['hero', 'menu', 'about', 'contact'],
    colorScheme: { bg: '#09090b', accent: '#3b82f6' },
    themeName: 'Modern Dark'
  };

  console.log('1. Fetching rules for Track A...');
  const rules = getRulesForPhase('track_a');
  if (rules.includes('# HIGH-QUALITY IMAGE LIBRARY')) {
    console.log('✅ Success: HIGH-QUALITY IMAGE LIBRARY found in Track A rules.');
  } else {
    console.error('❌ Failure: HIGH-QUALITY IMAGE LIBRARY NOT found in Track A rules.');
  }

  console.log('\n2. Building Track A Prompt...');
  const { systemPrompt, userMessage } = buildTrackAPrompt(sitePlan);

  if (systemPrompt.includes('ALWAYS use high-quality Unsplash URLs')) {
    console.log('✅ Success: System prompt updated with Unsplash instructions.');
  } else {
    console.error('❌ Failure: System prompt missing Unsplash instructions.');
  }

  if (userMessage.includes('NEVER use placehold.co')) {
    console.log('✅ Success: User message updated to forbid placeholders.');
  } else {
    console.error('❌ Failure: User message missing placeholder prohibition.');
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

verify().catch(console.error);
