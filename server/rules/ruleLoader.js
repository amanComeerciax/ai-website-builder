/**
 * Rule Loader V3.0
 * 
 * Synchronously loads the distinct rule sections from the hard drive on boot.
 * Exports `getRulesForPhase(phaseName)` to return exact string chunks.
 * 
 * Phase injection map (V3.0):
 *   parse              → Section 2
 *   collect_context     → Section 2 (subset for context analysis)
 *   plan               → Sections 3 + 4 + 5
 *   generate_html      → Sections 6 + 8
 *   generate_nextjs    → Sections 7 + 8 + 9
 *   error_fix          → Section 8 only
 *   iteration          → Section 10 FIRST, then relevant sections
 *   iteration_html     → Section 10 + 6 + 8
 *   iteration_nextjs   → Section 10 + 7 + 8
 *   validate           → Section 8
 */

const fs = require('fs');
const path = require('path');

// Cache the files in memory upon initial require
const CACHE = {
  section2:  fs.readFileSync(path.join(__dirname, 'section-2-parse.md'), 'utf8'),
  section3:  fs.readFileSync(path.join(__dirname, 'section-3-typography.md'), 'utf8'),
  section4:  fs.readFileSync(path.join(__dirname, 'section-4-color.md'), 'utf8'),
  section5:  fs.readFileSync(path.join(__dirname, 'section-5-layout.md'), 'utf8'),
  section6:  fs.readFileSync(path.join(__dirname, 'section-6-track-a.md'), 'utf8'),
  section7:  fs.readFileSync(path.join(__dirname, 'section-7-track-b.md'), 'utf8'),
  section8:  fs.readFileSync(path.join(__dirname, 'section-8-quality.md'), 'utf8'),
  section9:  fs.readFileSync(path.join(__dirname, 'section-9-components.md'), 'utf8'),
  section10: fs.readFileSync(path.join(__dirname, 'section-10-iteration.md'), 'utf8'),
};

/**
 * Get exactly the right set of markdown rule constraints for the specific worker phase.
 * Aligns 100% with the V3.0 Section 1 Injection Map.
 * 
 * @param {'parse'|'collect_context'|'plan'|'generate_html'|'generate_nextjs'|'phase3_html'|'phase3_nextjs'|'error_fix'|'iteration'|'iteration_html'|'iteration_nextjs'|'validate'} phaseName 
 * @returns {string} The concatenated rule string constraints
 */
function getRulesForPhase(phaseName) {
  const SEP = '\n\n---\n\n';
  switch (phaseName) {
    // ── Parsing & Context ──
    case 'parse':
      return CACHE.section2;
    case 'collect_context':
      return CACHE.section2;

    // ── Planning ──
    case 'plan':
      return [CACHE.section3, CACHE.section4, CACHE.section5].join(SEP);

    // ── Code Generation ──
    case 'generate_html':
    case 'phase3_html':
      return [CACHE.section3, CACHE.section4, CACHE.section5, CACHE.section6, CACHE.section8].join(SEP);
    case 'generate_nextjs':
    case 'phase3_nextjs':
      return [CACHE.section3, CACHE.section4, CACHE.section5, CACHE.section7, CACHE.section8, CACHE.section9].join(SEP);

    // ── Error Fixing ──
    case 'error_fix':
      return CACHE.section8;

    // ── Iteration (Section 10 always injected FIRST) ──
    case 'iteration':
      return CACHE.section10;
    case 'iteration_html':
      return [CACHE.section10, CACHE.section3, CACHE.section4, CACHE.section5, CACHE.section6, CACHE.section8].join(SEP);
    case 'iteration_nextjs':
      return [CACHE.section10, CACHE.section3, CACHE.section4, CACHE.section5, CACHE.section7, CACHE.section8].join(SEP);

    // ── Validation ──
    case 'validate':
      return CACHE.section8;

    default:
      throw new Error(`Unknown phaseName for rules: ${phaseName}`);
  }
}

module.exports = {
  getRulesForPhase,
  CACHE // Exported for testing/debugging
};

