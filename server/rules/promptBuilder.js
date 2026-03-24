/**
 * Prompt Builder V3.0
 * 
 * Constructs exactly the system prompts given per phase.
 * It injects loaded rule chunks inside `<agent_instructions> ... </agent_instructions>` 
 * XML blocks so the LLM respects them as hard boundaries.
 * 
 * V3.0 Builders:
 *   buildContextQuestions(userPrompt)            → Groq (context collection)
 *   buildParsePrompt()                           → Groq (intent classification)
 *   buildPlanPrompt(parsedJSON)                  → Groq (architecture planning)
 *   buildTrackAPrompt(planDetails)               → Mistral (HTML generation)
 *   buildTrackBPrompt(fileContext)               → Mistral (Next.js generation)
 *   buildSummaryPrompt(filesCreated, plan)        → Groq (post-gen summary)
 *   buildErrorClassifyPrompt(errorText)           → Groq (error classification)
 *   buildFixFilePrompt(fileContent, fixInstr)     → Mistral (targeted fix)
 */

const { getRulesForPhase } = require('./ruleLoader');

// ═══════════════════════════════════════════════
// V3.0 NEW: Context Collection (Stage 0)
// ═══════════════════════════════════════════════

/**
 * Builds the context collection prompt for the context agent.
 * Model: Groq | Task: collect_context
 * @param {string} userPrompt - The user's raw first prompt
 * @returns {string} System prompt for context question generation
 */
function buildContextQuestions(userPrompt) {
  return `You are the StackForge AI Context Agent.
Your job is to analyze a user's website request and determine what information is missing.

<user_prompt>
${userPrompt}
</user_prompt>

Rules:
1. If the prompt has enough detail (business type + purpose clear), return { "questions": [] }
2. Never ask more than 3 questions.
3. Never ask about colors or fonts — you will infer those later.
4. Never ask if the prompt is over 15 words and mentions the business type.
5. Each question should have type: "text_input" or "chip_select"
6. For chip_select questions, provide 3-5 chip options.

Return ONLY valid JSON:
{
  "questions": [
    {
      "text": "What is the name of your business?",
      "type": "text_input",
      "chips": []
    },
    {
      "text": "What vibe should the website give?",
      "type": "chip_select",
      "chips": ["Modern & minimal", "Warm & cozy", "Bold & vibrant", "Professional", "Luxury"]
    }
  ],
  "skipAllowed": true
}`;
}

// ═══════════════════════════════════════════════
// Phase 1: Parse (existing, updated for V3.0)
// ═══════════════════════════════════════════════

/**
 * Builds the Phase 1: Parse string.
 * Model: Groq | Task: parse_prompt
 * @returns {string} Fully formed system prompt
 */
function buildParsePrompt() {
  const rules = getRulesForPhase('parse');
  return `You are the master Parser for StackForge AI.
Your single goal is to extract structured JSON from the user prompt according to the given rules.

<agent_instructions>
${rules}
</agent_instructions>

Remember: Output ONLY valid JSON matching the exact schema provided in the rules. Do not enclose it in markdown codeblocks. Do not include any other text output.`;
}

// ═══════════════════════════════════════════════
// Phase 1.5: Template Matching (New V3.0)
// ═══════════════════════════════════════════════

/**
 * Builds the template selector prompt for the matching agent.
 * Model: Groq | Task: select_template
 * @param {Array} availableTemplates - Minified template metadata list
 * @returns {string} System prompt
 */
function buildTemplateMatchPrompt(availableTemplates) {
  return `You are the StackForge AI Template Matcher.
I will give you the user's parsed intent for a website.
Review the following list of available templates:

<available_templates>
${JSON.stringify(availableTemplates, null, 2)}
</available_templates>

Your job is to decide if any of these templates are a good starting point for the user's request.
Match based on 'siteType', 'description', and 'features'.
If nothing fits well, return null.

Return ONLY valid JSON:
{
  "templateSlug": "the-matched-slug" // or null
}`;
}

// ═══════════════════════════════════════════════
// Phase 2: Plan (existing, updated for V3.0)
// ═══════════════════════════════════════════════

/**
 * Builds the Phase 2: Plan string.
 * Model: Groq | Task: plan_structure
 * @param {object} parsedJSON Details computed from Phase 1.
 * @returns {string} Fully formed system prompt
 */
function buildPlanPrompt(parsedJSON) {
  const rules = getRulesForPhase('plan');
  return `You are the Lead Technical Architect for StackForge AI.
Your goal is to draft a component file tree and structure utilizing the decisions provided.

<user_decisions>
${JSON.stringify(parsedJSON, null, 2)}
</user_decisions>

<agent_instructions>
${rules}
</agent_instructions>

Return a structural JSON array of files to create with corresponding elements. Do not return anything else.`;
}

// ═══════════════════════════════════════════════
// Phase 3: Track A — HTML (existing, updated)
// ═══════════════════════════════════════════════

/**
 * Builds the Phase 3 (Track A - HTML) system prompt 
 * Model: Mistral | Task: generate_html
 * @param {object} fileContext Context covering name, goal, dependencies
 * @param {Array} [templateFiles] Optional array of existing template file objects to act as scaffolding
 * @returns {string} System prompt
 */
function buildTrackAPrompt(fileContext, templateFiles = null) {
  const rules = getRulesForPhase('generate_html');
  const planStr = JSON.stringify({
    siteType: fileContext.siteType || 'website',
    sections: fileContext.sections || [],
    colorScheme: fileContext.colorScheme || fileContext.colors || {},
    fonts: fileContext.fonts || {}
  }, null, 2);

  let scaffoldingSection = '';
  if (templateFiles && Array.isArray(templateFiles) && templateFiles.length > 0) {
    const filesStr = templateFiles.map(f => `--- ${f.path} ---\n${f.content}\n`).join('\n');
    scaffoldingSection = `\n<template_scaffolding>\n${filesStr}\n</template_scaffolding>\n\nIMPORTANT: You have been provided with production-ready template scaffolding above. Do NOT hallucinate from scratch. You MUST use these exact files as your starting point, carefully adapting them to fit the <file_objective>. Preserve the underlying layout logic but completely rewrite the text, colors, and specific sections to match the user's request.\n`;
  }

  return `You are an elite front-end engineer building a single-file HTML website.

<plan_details>
${planStr}
</plan_details>
${scaffoldingSection}
<agent_instructions>
${rules}
</agent_instructions>

CRITICAL STYLING INSTRUCTIONS:
1. You MUST apply the \`colorScheme\` from <plan_details> by creating CSS variables in a <style> block as dictated by the Color System Rules.
2. You MUST apply the \`fonts\` from <plan_details> by importing them via Google Fonts and utilizing them as dictated by the Typography Rules.
3. Use Tailwind CSS utility classes extensively. Ensure every section has proper padding, responsive grids, and modern, high-quality professional UI aesthetics. Do not generate plain blank sections.

Return ONLY the full index.html file. Do not use Markdown bounds. Never apologize or explain your code.`;
}

// ═══════════════════════════════════════════════
// Phase 3: Track B — Next.js (existing, updated)
// ═══════════════════════════════════════════════

/**
 * Builds the Phase 3 (Track B - Next.js) system prompt 
 * Model: Mistral | Task: generate_file
 * @param {object} fileContext Context covering name, goal, dependencies
 * @param {Array} [templateFiles] Optional array of existing template file objects to act as scaffolding
 * @returns {string} System prompt
 */
function buildTrackBPrompt(fileContext, templateFiles = null) {
  const rules = getRulesForPhase('generate_nextjs');
  
  // Compact the plan to prevent prompt bloat
  const compactPlan = {
    sections: fileContext.sections || fileContext.components || [],
    colorScheme: fileContext.colorScheme || fileContext.colors || {},
    fonts: fileContext.fonts || {},
    siteType: fileContext.siteType || 'website'
  };
  if (Array.isArray(compactPlan.sections) && compactPlan.sections.length > 0 && typeof compactPlan.sections[0] === 'object') {
    compactPlan.sections = compactPlan.sections.map(s => s.name || s.type || s.id || JSON.stringify(s).substring(0, 100));
  }
  
  const planStr = JSON.stringify(compactPlan, null, 2);

  let scaffoldingSection = '';
  if (templateFiles && Array.isArray(templateFiles) && templateFiles.length > 0) {
    const filesStr = templateFiles.map(f => `--- ${f.path} ---\n${f.content}\n`).join('\n');
    scaffoldingSection = `\n<template_scaffolding>\n${filesStr}\n</template_scaffolding>\n\nIMPORTANT: You have been provided with production-ready template scaffolding above. Do NOT hallucinate from scratch. You MUST use these exact files as your starting point, carefully adapting them to fit the <file_objective>. Preserve the underlying layout logic but completely rewrite the text, colors, and specific sections to match the user's request.\n`;
  }
  
  return `You are an elite Next.js 14 App Router engineer.

<file_objective>
${planStr}
</file_objective>
${scaffoldingSection}
<agent_instructions>
${rules}
</agent_instructions>

CRITICAL STYLING INSTRUCTIONS:
1. You MUST apply the \`colorScheme\` from <file_objective> by creating CSS variables in \`app/globals.css\` as dictated by the Color System Rules.
2. You MUST apply the \`fonts\` from <file_objective> by configuring them in \`app/layout.js\` (or dynamically) as dictated by the Typography Rules.
3. Use Tailwind CSS utility classes extensively. Ensure every component has proper padding, responsive grids, and modern, high-quality professional UI aesthetics. Do not generate plain blank sections.
4. IMPORTANT: You have been provided with a library of reusable UI components in Section 9 of your <agent_instructions> (e.g., Button, RevealOnScroll, CardStack). You MUST write these exact components into their own files (e.g., 'components/Button.jsx') and IMPORT them into your pages. Do NOT use plain HTML tags like <button> when a custom Component is provided.

CRITICAL: Your output MUST be a single JSON object with this exact schema:
{
  "files": {
    "app/page.js": "// full component code as a string here",
    "app/layout.js": "// full component code as a string here",
    "app/globals.css": "/* full CSS here */"
  }
}

Rules:
- The top-level key MUST be "files"
- Each key inside "files" is a file path (string)
- Each value inside "files" is the complete file code (string)
- Include at minimum: app/page.js, app/layout.js, app/globals.css
- Do NOT use arrays. Every value must be a string.
- Do NOT add metadata keys like "path", "installCommand", "dependencies" at top level.
- Output ONLY the JSON. No markdown fences. No explanation.

CRITICAL FINAL REMINDER (DO NOT IGNORE):
1. Any file using framer-motion, lucide-react, or React hooks (useState, useEffect) MUST have "use client"; at the very first line.
2. NEVER use hex colors like text-[#ff0000]. ALWAYS use tailwind standard colors (text-red-500) or CSS variables (text-[var(--primary)]).`;
}

// ═══════════════════════════════════════════════
// V3.0 NEW: Summary (Stage 4)
// ═══════════════════════════════════════════════

/**
 * Builds the post-generation summary prompt.
 * Model: Groq | Task: summarize
 * @param {string[]} filesCreated - Array of file paths created
 * @param {object} plan - The Phase 2 plan JSON
 * @returns {string} System prompt for summary generation
 */
function buildSummaryPrompt(filesCreated, plan) {
  return `You are the StackForge AI Summary Agent.
Given the files created and the original plan, produce a concise summary.

<files_created>
${JSON.stringify(filesCreated)}
</files_created>

<original_plan>
${JSON.stringify({ siteType: plan.siteType, sections: plan.sections, colorScheme: plan.colorScheme })}
</original_plan>

Return ONLY valid JSON:
{
  "summary": "Built [AppName] — a [description] with [key features].",
  "appName": "Name",
  "suggestedActions": [
    "Change the color scheme to dark",
    "Add an online ordering section",
    "Make it mobile responsive",
    "Add customer testimonials"
  ]
}`;
}

// ═══════════════════════════════════════════════
// V3.0 NEW: Error Classification (Stage 6)
// ═══════════════════════════════════════════════

/**
 * Builds the error classification prompt for auto-fix loop.
 * Model: Groq | Task: classify_error
 * @param {string} errorText - Raw terminal error output
 * @returns {string} System prompt for error classification
 */
function buildErrorClassifyPrompt(errorText) {
  return `You are the StackForge AI Error Classifier.
Classify the following build error and provide a fix strategy.

<error_text>
${errorText.substring(0, 2000)}
</error_text>

Return ONLY valid JSON:
{
  "errorType": "IMPORT_ERROR | SYNTAX_ERROR | TYPE_ERROR | MISSING_PACKAGE | RUNTIME_ERROR | CONFIG_ERROR",
  "affectedFile": "path/to/file.js",
  "affectedLine": 42,
  "fixStrategy": "Brief description of the fix",
  "fixInstruction": "Specific instruction for the code fixer to follow"
}`;
}

// ═══════════════════════════════════════════════
// V3.0 NEW: Targeted File Fix (Stage 6)
// ═══════════════════════════════════════════════

/**
 * Builds the targeted file fix prompt for auto-fix loop.
 * Model: Mistral | Task: fix_file or fix_error
 * @param {string} fileContent - Current content of the broken file
 * @param {string} fixInstruction - Specific instruction from error classifier
 * @returns {string} System prompt for targeted fix
 */
function buildFixFilePrompt(fileContent, fixInstruction) {
  const rules = getRulesForPhase('error_fix');
  return `You are the StackForge AI Code Fixer.
Fix ONLY the specific issue described. Do not restructure or improve unrelated code.

<fix_instruction>
${fixInstruction}
</fix_instruction>

<current_file>
${fileContent.substring(0, 3000)}
</current_file>

<agent_instructions>
${rules}
</agent_instructions>

Return ONLY the complete corrected file content. No markdown fences. No explanation.`;
}

module.exports = {
  buildContextQuestions,
  buildTemplateMatchPrompt,
  buildParsePrompt,
  buildPlanPrompt,
  buildTrackAPrompt,
  buildTrackBPrompt,
  buildSummaryPrompt,
  buildErrorClassifyPrompt,
  buildFixFilePrompt,
};

