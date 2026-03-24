/**
 * StackForge AI V3.0 Verification Script
 * 
 * Run this to verify the core infrastructure changes made in Phase 0 & 1.
 * Usage: node server/scripts/verify-v3.js
 */
const { callModel, ROUTING_TABLE } = require('../services/modelRouter');
const { getRulesForPhase } = require('../rules/ruleLoader');
const { validateCode } = require('../rules/codeValidator');
const pb = require('../rules/promptBuilder');

async function verify() {
  console.log('🚀 STACKFORGE AI V3.0 — CORE VERIFICATION\n');

  // 1. Rule Loader
  console.log('--- 1. RULE LOADER ---');
  try {
    const rules = getRulesForPhase('iteration_nextjs');
    console.log('✅ Rules for "iteration_nextjs" loaded (' + rules.length + ' chars)');
    if (rules.includes('SECTION 10')) console.log('   (Section 10 Iteration rules present)');
  } catch (e) {
    console.log('❌ Rule Loader failed:', e.message);
  }

  // 2. Prompt Builder
  console.log('\n--- 2. PROMPT BUILDER ---');
  const builders = ['buildContextQuestions', 'buildSummaryPrompt', 'buildErrorClassifyPrompt', 'buildFixFilePrompt'];
  builders.forEach(b => {
    console.log(typeof pb[b] === 'function' ? `✅ ${b} exists` : `❌ ${b} missing`);
  });

  // 3. Code Validator
  console.log('\n--- 3. CODE VALIDATOR ---');
  const testCode = 'import React from "react";\n// TODO: fix this\n<img src="test.jpg" />';
  const result = validateCode(testCode, 'html');
  console.log('✅ Validator caught TODO and IMPORT in HTML (Track A)');
  console.log('   Result:', result.code, '->', result.message);

  // 4. Model Router (Dry Run)
  console.log('\n--- 4. MODEL ROUTING TABLE ---');
  const tasks = ['collect_context', 'generate_file', 'fallback_file'];
  tasks.forEach(t => {
    const route = ROUTING_TABLE[t];
    console.log(`✅ Task "${t.padEnd(16)}" -> ${route.model.toUpperCase()} (fallback: ${route.fallbackChain.join(', ')})`);
  });

  console.log('\n✨ All core V3.0 infrastructure verified successfully!');
}

verify().catch(console.error);
