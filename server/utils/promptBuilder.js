/**
 * Prompt Builder — constructs system/user prompts for each generation phase
 * 
 * 4 exported functions, one per phase.
 * CRITICAL: buildPhase3Prompt keeps system prompt under 800 tokens for Qwen.
 */

const { getRulesForPhase } = require('./ruleLoader.js');

/**
 * Phase 1: Parse the user's prompt (Mistral)
 * Classifies intent, interprets vague phrases, extracts assumptions.
 */
function buildPhase1Prompt(userPrompt) {
  const rules = getRulesForPhase('phase1');

  const systemPrompt = [
    'You are an expert prompt analyst for a website builder AI.',
    'Analyze the user request and output structured JSON.',
    '',
    rules,
    '',
    'Return ONLY valid JSON matching the output format specified in the rules.',
    'No markdown fences, no explanations.'
  ].join('\n');

  const userMessage = `Analyze this website request:\n\n"${userPrompt}"`;

  return { systemPrompt, userMessage };
}

/**
 * Phase 2: Plan the file structure (Mistral)
 * Takes Phase 1 output and produces a file tree + design decisions.
 */
function buildPhase2Prompt(phase1JSON) {
  const rules = getRulesForPhase('phase2');

  const systemPrompt = [
    'You are a senior frontend architect.',
    'Given an analyzed request, plan the complete file structure and design system.',
    '',
    rules,
    '',
    'Return ONLY valid JSON with this shape:',
    '{',
    '  "fileTree": [{"path": "src/App.jsx", "purpose": "Main entry", "imports": [], "exports": ["default"]}],',
    '  "sections": ["hero", "features", "testimonials", "cta", "footer"],',
    '  "colorScheme": {"bg": "#0f0f0f", "surface": "#1a1a1a", "text": "#e8e8e8", "accent": "#3b82f6"},',
    '  "fontPair": {"heading": "Syne", "body": "DM Sans"},',
    '  "projectGlossary": {"AppName": "string", "tagline": "string"}',
    '}',
    'No markdown fences, no explanations.'
  ].join('\n');

  const userMessage = `Plan the file structure for this analyzed request:\n\n${JSON.stringify(phase1JSON, null, 2)}`;

  return { systemPrompt, userMessage };
}

/**
 * Phase 3: Generate a single file (Qwen)
 * CRITICAL: System prompt MUST stay under 800 tokens.
 * Only includes code-quality-rules.md — nothing else.
 */
function buildPhase3Prompt(fileSpec, glossary) {
  const rules = getRulesForPhase('phase3_qwen');

  // Keep system prompt minimal — Qwen has 4096 context cap
  const systemPrompt = [
    'You are a code generator. Output ONLY the file content. No markdown fences.',
    '',
    rules
  ].join('\n');

  const userMessage = [
    `Write the file: ${fileSpec.path}`,
    `Purpose: ${fileSpec.purpose || 'Component'}`,
    fileSpec.imports?.length ? `Imports: ${fileSpec.imports.join(', ')}` : '',
    `Use exactly these names: ${JSON.stringify(glossary || {})}`,
    '',
    'Return ONLY the raw file content. No JSON wrapping. No markdown fences. No explanation.'
  ].filter(Boolean).join('\n');

  return { systemPrompt, userMessage };
}

/**
 * Phase 4: Summarize the generation (Mistral)
 * Takes the list of created files + plan, returns summary + suggested actions.
 */
function buildSummaryPrompt(filesCreated, plan) {
  const systemPrompt = [
    'You are a UX-focused AI that summarizes code generation results.',
    'Given the files that were created and the original plan, write a brief summary.',
    '',
    'Return ONLY valid JSON:',
    '{',
    '  "summary": "Built [AppName] — a [description] with [N] components.",',
    '  "appName": "string",',
    '  "suggestedActions": ["Verify it works", "Add authentication", "Make it mobile responsive", "Add dark mode"]',
    '}',
    'The suggestedActions array must have exactly 4 items — natural follow-up tasks the user might want.',
    'No markdown fences, no explanations.'
  ].join('\n');

  const userMessage = [
    'Summarize this generation:',
    '',
    `Files created: ${filesCreated.join(', ')}`,
    '',
    `Original plan: ${JSON.stringify(plan, null, 2)}`
  ].join('\n');

  return { systemPrompt, userMessage };
}

module.exports = { buildPhase1Prompt, buildPhase2Prompt, buildPhase3Prompt, buildSummaryPrompt };
