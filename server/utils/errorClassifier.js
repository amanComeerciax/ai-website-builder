/**
 * Error Classifier V3.0
 * 
 * Wraps the buildErrorClassifyPrompt to provide a callable utility.
 * Takes a raw error string (from codeValidator or a build error),
 * sends it to Groq for classification, and returns structured JSON.
 */

const { callModel } = require('../services/modelRouter.js');
const { buildErrorClassifyPrompt } = require('../rules/promptBuilder.js');

/**
 * Strip markdown fences from AI JSON responses
 */
function stripFences(str) {
  return str.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

/**
 * Classify a code validation error or build error into structured fix instructions.
 * 
 * @param {string} errorText - Raw error string (e.g., "Remove all inline style=...")
 * @param {string} [affectedFile] - Optional file path hint
 * @returns {Promise<{ errorType: string, affectedFile: string, fixInstruction: string }>}
 */
async function classifyError(errorText, affectedFile = null) {
  try {
    const systemPrompt = buildErrorClassifyPrompt(errorText);
    const result = await callModel('classify_error', errorText, systemPrompt);
    
    const parsed = JSON.parse(stripFences(result.content));
    
    if (parsed && parsed.fixInstruction) {
      console.log(`[ErrorClassifier] ✅ Classified: ${parsed.errorType} → ${parsed.fixInstruction.substring(0, 80)}`);
      return {
        errorType: parsed.errorType || 'UNKNOWN',
        affectedFile: parsed.affectedFile || affectedFile || 'unknown',
        affectedLine: parsed.affectedLine || null,
        fixStrategy: parsed.fixStrategy || '',
        fixInstruction: parsed.fixInstruction
      };
    }
    
    throw new Error('Missing fixInstruction in classifier response');
  } catch (err) {
    console.warn(`[ErrorClassifier] ⚠️ Classification failed (${err.message}), using generic fallback`);
    
    // Graceful fallback — return generic fix instruction derived from the error text itself
    return {
      errorType: 'UNKNOWN',
      affectedFile: affectedFile || 'unknown',
      affectedLine: null,
      fixStrategy: 'generic',
      fixInstruction: `Fix the following issue in the code: ${errorText.substring(0, 500)}`
    };
  }
}

module.exports = { classifyError };
