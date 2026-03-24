/**
 * Rule Loader — reads .md rule files from server/rules/ into memory
 * 
 * On module load: reads all .md files, caches in memory.
 * Export: getRulesForPhase(phase) returns concatenated rules for that phase.
 */

const fs = require('fs');
const path = require('path');

const RULES_DIR = path.join(__dirname, '..', 'rules');
const rulesCache = {};

// Load all .md files on module init
try {
  if (fs.existsSync(RULES_DIR)) {
    const files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(RULES_DIR, file), 'utf8');
      rulesCache[file] = content;
      console.log(`[Rule Loader] Loaded: ${file} (${content.length} chars)`);
    }
    console.log(`[Rule Loader] ✅ ${Object.keys(rulesCache).length} rule files cached`);
  } else {
    console.warn(`[Rule Loader] ⚠️ Rules directory not found: ${RULES_DIR}`);
  }
} catch (err) {
  console.error(`[Rule Loader] Failed to load rules:`, err.message);
}

/**
 * Phase-to-rules mapping
 */
const PHASE_MAP = {
  // Phase 1: Classification only — just needs prompt parsing rules (~4KB)
  // Removed page-blueprints.md (45KB) — classification doesn't need layout examples
  phase1: ['prompt-parsing-rules.md'],

  // Phase 2: Planning — structural rules only (~6KB)
  // Removed design-rulebook.md (52KB) — design tokens are communicated inline via prompt
  phase2: ['spacing-system.md', 'component-standards.md', 'responsive-rules.md', 'SKILL.md'],

  // Phase 3 & Track rules: compact essentials (~4KB)
  phase3_qwen: ['code-quality-rules.md', 'package-policy.md'],
  track_a: ['code-quality-rules.md', 'package-policy.md'],
  track_b: ['code-quality-rules.md', 'package-policy.md'],

  iteration: ['iteration-rules.md'],
};

/**
 * Get concatenated rules for a generation phase.
 * 
 * @param {string} phase - 'phase1' | 'phase2' | 'phase3_qwen' | 'iteration'
 * @returns {string} Concatenated rule content (only files that exist)
 */
function getRulesForPhase(phase) {
  const ruleFiles = PHASE_MAP[phase];
  if (!ruleFiles) {
    console.warn(`[Rule Loader] Unknown phase: "${phase}". Available: ${Object.keys(PHASE_MAP).join(', ')}`);
    return '';
  }

  const parts = [];
  for (const file of ruleFiles) {
    if (rulesCache[file]) {
      parts.push(rulesCache[file]);
    }
    // Silently skip files that don't exist yet — they'll be created in Task 10
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Get a single rule file by name.
 * @param {string} filename - e.g. 'code-quality-rules.md'
 * @returns {string|null}
 */
function getRule(filename) {
  return rulesCache[filename] || null;
}

module.exports = { getRulesForPhase, getRule, rulesCache };
