/**
 * Code Validator — checks AI-generated file content for quality violations
 * 
 * Export: validateFile(filePath, content) → { valid, violations }
 * Used after Phase 3 generation to catch common LLM code quality issues.
 */

/**
 * Validate a generated file for code quality violations.
 * 
 * @param {string} filePath - File path (e.g. "src/App.jsx")
 * @param {string} content - File content string
 * @returns {{ valid: boolean, violations: Array<{type: string, line: number, detail: string}> }}
 */
function validateFile(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const isCSS = filePath.endsWith('.css');
  const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.tsx');
  const isHTML = filePath.endsWith('.html');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // ── console.log (JS/JSX only) ──
    if (isJSX && /console\.log\(/.test(line)) {
      violations.push({ type: 'console_log', line: lineNum, detail: 'console.log() found — remove for production' });
    }

    // ── TODO comments ──
    if (/\/\/\s*TODO|\/\*\s*TODO/i.test(line)) {
      violations.push({ type: 'todo_comment', line: lineNum, detail: 'TODO comment left in code' });
    }

    // ── Lorem ipsum ──
    if (/lorem ipsum/i.test(line)) {
      violations.push({ type: 'lorem_ipsum', line: lineNum, detail: 'Lorem ipsum placeholder text found' });
    }

    // ── Inline styles (HTML/JSX) ──
    if ((isJSX || isHTML) && /style="[^"]+"/.test(line)) {
      violations.push({ type: 'inline_style', line: lineNum, detail: 'Inline style attribute found — use CSS classes' });
    }

    // ── Missing alt on img (HTML/JSX) ──
    if ((isJSX || isHTML) && /<img(?![^>]*\balt\s*=)/i.test(line)) {
      violations.push({ type: 'missing_alt', line: lineNum, detail: '<img> missing alt attribute' });
    }
  }

  // ── Hardcoded hex colors outside :root (CSS files) ──
  if (isCSS) {
    // Find all hex colors
    const hexMatches = [...content.matchAll(/#[0-9a-fA-F]{3,8}\b/g)];
    // Check if they're inside :root block
    const rootBlockMatch = content.match(/:root\s*\{([^}]*)\}/s);
    const rootContent = rootBlockMatch ? rootBlockMatch[1] : '';

    for (const match of hexMatches) {
      const isInRoot = rootContent.includes(match[0]);
      // Allow common safe values: #000, #fff, #000000, #ffffff, transparent-like
      const isSafeValue = /^#(000|fff|000000|ffffff|0{3,6}|f{3,6})$/i.test(match[0]);

      if (!isInRoot && !isSafeValue) {
        // Find which line this is on
        const upToMatch = content.substring(0, match.index);
        const lineNum = upToMatch.split('\n').length;
        violations.push({
          type: 'hardcoded_hex',
          line: lineNum,
          detail: `Hardcoded color ${match[0]} outside :root — use CSS custom property`
        });
      }
    }
  }

  // Cap at max 2 inline style violations (don't spam)
  const inlineStyleViolations = violations.filter(v => v.type === 'inline_style');
  if (inlineStyleViolations.length > 2) {
    // Keep only first 2
    const indicesToRemove = inlineStyleViolations.slice(2).map(v => violations.indexOf(v));
    for (const idx of indicesToRemove.reverse()) {
      violations.splice(idx, 1);
    }
    violations.push({
      type: 'inline_style',
      line: 0,
      detail: `${inlineStyleViolations.length} total inline styles found — use CSS classes instead`
    });
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

module.exports = { validateFile };
