/**
 * Auto Fixer V3.0
 * 
 * Wraps the buildFixFilePrompt to provide a callable utility.
 * Takes a broken file + fix instruction, sends it to Mistral for surgical repair,
 * and re-validates the result before returning.
 */

const { callModel } = require('../services/modelRouter.js');
const { buildFixFilePrompt } = require('../rules/promptBuilder.js');
const { validateCode } = require('../rules/codeValidator.js');

/**
 * Strip markdown fences from AI responses
 */
function stripFences(str) {
  return str.replace(/^```(?:html|jsx?|tsx?|css|json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

/**
 * Extract actual code content from a JSON wrapper envelope.
 * Models sometimes return: {"status": "fixed", "file": "...code..."} 
 * or {"code": "...code..."} even when told to return raw code.
 */
function extractCodeFromJSON(str) {
  if (!str || !str.trimStart().startsWith('{')) return str;
  try {
    const parsed = JSON.parse(str);
    // Check all known wrapper keys the model might use
    const code = parsed.file || parsed.code || parsed.content || parsed.html || 
                 parsed.fixedCode || parsed.fixed_code || parsed.result;
    if (code && typeof code === 'string' && code.length > 20) {
      console.log('[AutoFixer] Extracted code from JSON wrapper envelope');
      return code;
    }
  } catch {
    // Not valid JSON — return as-is
  }
  return str;
}

/**
 * Attempt to surgically fix a single file based on a classified error.
 * 
 * @param {object} opts
 * @param {string} opts.filePath - Path of the broken file (e.g., "app/page.js")
 * @param {string} opts.fileContent - Current broken content of the file
 * @param {string} opts.fixInstruction - Specific fix instruction from errorClassifier
 * @param {string} opts.outputTrack - 'html' or 'nextjs'
 * @param {number} [opts.maxAttempts=2] - Max fix attempts before giving up
 * @returns {Promise<{ fixed: boolean, content: string, attempts: number }>}
 */
async function fixFile({ filePath, fileContent, fixInstruction, outputTrack, maxAttempts = 2 }) {
  let currentContent = fileContent;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[AutoFixer] Attempt ${attempt}/${maxAttempts} on ${filePath}`);
      
      const systemPrompt = buildFixFilePrompt(currentContent, fixInstruction);
      const result = await callModel('fix_error', `Fix the file: ${filePath}`, systemPrompt);
      
      const fixedContent = extractCodeFromJSON(stripFences(result.content));
      
      if (!fixedContent || fixedContent.length < 20) {
        console.warn(`[AutoFixer] Fix attempt ${attempt} returned empty/tiny content`);
        continue;
      }
      
      // Re-validate the fixed code
      const validation = validateCode(fixedContent, outputTrack);
      
      if (validation.isValid) {
        console.log(`[AutoFixer] ✅ Fix succeeded on attempt ${attempt} for ${filePath} (${fixedContent.length} chars)`);
        return { fixed: true, content: fixedContent, attempts: attempt };
      }
      
      // Fix didn't fully resolve — feed the new validation error back for next attempt
      console.warn(`[AutoFixer] Fix attempt ${attempt} still fails validation: ${validation.code}`);
      currentContent = fixedContent;
      fixInstruction = `Previous fix was incomplete. Still failing: ${validation.message}`;
      
    } catch (err) {
      console.error(`[AutoFixer] Fix attempt ${attempt} threw: ${err.message}`);
    }
  }
  
  console.warn(`[AutoFixer] ❌ All ${maxAttempts} fix attempts exhausted for ${filePath}`);
  return { fixed: false, content: currentContent, attempts: maxAttempts };
}

module.exports = { fixFile };
