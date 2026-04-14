/**
 * Template Auto-Chunker — Smart section-based HTML splitting
 * 
 * Solves the AI output token limit problem by splitting large templates
 * into independent sections that can be processed individually.
 * 
 * Flow: chunkTemplate() → AI processes each section → reassembleTemplate()
 */

const SAFE_LINE_THRESHOLD = 800;
const SAFE_BYTE_THRESHOLD = 25000; // 25KB

/**
 * Determine if a template needs chunking
 * @param {string} html - Full HTML string
 * @returns {boolean}
 */
function shouldChunk(html) {
  const lineCount = html.split('\n').length;
  const byteCount = Buffer.byteLength(html, 'utf-8');
  const needs = lineCount > SAFE_LINE_THRESHOLD || byteCount > SAFE_BYTE_THRESHOLD;
  
  if (needs) {
    console.log(`[Chunker] 📏 Template needs chunking: ${lineCount} lines, ${(byteCount / 1024).toFixed(1)}KB (thresholds: ${SAFE_LINE_THRESHOLD} lines / ${(SAFE_BYTE_THRESHOLD / 1024).toFixed(0)}KB)`);
  }
  
  return needs;
}

/**
 * Extract the <head>...</head> content from HTML
 * @param {string} html
 * @returns {{ headContent: string, afterHead: string }}
 */
function extractHead(html) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    return { headContent: '', afterHead: html };
  }
  return {
    headContent: headMatch[1].trim(),
    afterHead: html
  };
}

/**
 * Extract trailing <script> blocks from the body (before </body>)
 * These are shared JS that should NOT be sent to the AI for content editing.
 * @param {string} bodyHtml - Content between <body> and </body>
 * @returns {{ bodyWithoutScripts: string, scripts: string }}
 */
function extractTrailingScripts(bodyHtml) {
  // Match all <script>...</script> blocks at the end of the body
  const scriptBlocks = [];
  let remaining = bodyHtml.trimEnd();
  
  // Greedily collect script blocks from the end
  const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>\s*$/i;
  while (scriptRegex.test(remaining)) {
    const match = remaining.match(scriptRegex);
    if (match) {
      scriptBlocks.unshift(match[0].trim());
      remaining = remaining.slice(0, match.index).trimEnd();
    } else {
      break;
    }
  }
  
  return {
    bodyWithoutScripts: remaining,
    scripts: scriptBlocks.join('\n\n')
  };
}

/**
 * Split body HTML into semantic sections.
 * 
 * Detection order:
 * 1. Top-level <section>, <header>, <footer>, <nav>, <main>, <article> tags
 * 2. HTML comment markers like <!-- HERO -->, <!-- SERVICES -->
 * 3. Top-level divs with id attributes as fallback
 * 
 * @param {string} bodyHtml - Body content (without trailing scripts)
 * @returns {Array<{id: string, tag: string, html: string, lineCount: number}>}
 */
function splitIntoSections(bodyHtml) {
  const sections = [];
  
  // Strategy: Use regex to find top-level semantic elements
  // We need to handle nested tags carefully
  const sectionTags = ['section', 'header', 'footer', 'nav', 'main', 'article'];
  
  // Build a regex pattern to find opening tags of semantic elements
  // This approach walks through the HTML and identifies top-level blocks
  let remaining = bodyHtml;
  let sectionIndex = 0;
  let preamble = ''; // Content before the first section (cursors, overlays, etc.)
  
  // Find all top-level semantic blocks
  const tagPattern = new RegExp(
    `<(${sectionTags.join('|')})(\\s[^>]*)?>`,
    'gi'
  );
  
  let match;
  let lastEnd = 0;
  const blocks = [];
  
  // First pass: find all opening tags and their positions
  const openPositions = [];
  while ((match = tagPattern.exec(bodyHtml)) !== null) {
    openPositions.push({
      tag: match[1].toLowerCase(),
      attrs: match[2] || '',
      start: match.index,
      fullMatch: match[0]
    });
  }
  
  // Second pass: for each opening tag, find its matching closing tag
  for (const openTag of openPositions) {
    const closingTag = `</${openTag.tag}>`;
    
    // Find the matching closing tag (handling nesting)
    let depth = 1;
    let searchPos = openTag.start + openTag.fullMatch.length;
    const openRegex = new RegExp(`<${openTag.tag}(\\s|>)`, 'gi');
    const closeRegex = new RegExp(`</${openTag.tag}>`, 'gi');
    
    let closePos = -1;
    
    // Simple approach: find the closing tag at the same nesting level
    // Count opens and closes from the inner content
    const innerSearchStr = bodyHtml.slice(searchPos);
    let innerPos = 0;
    
    while (depth > 0 && innerPos < innerSearchStr.length) {
      // Find next open or close tag
      openRegex.lastIndex = innerPos;
      closeRegex.lastIndex = innerPos;
      
      const nextOpen = openRegex.exec(innerSearchStr);
      const nextClose = closeRegex.exec(innerSearchStr);
      
      if (!nextClose) break; // malformed HTML
      
      if (nextOpen && nextOpen.index < nextClose.index) {
        depth++;
        innerPos = nextOpen.index + nextOpen[0].length;
      } else {
        depth--;
        if (depth === 0) {
          closePos = searchPos + nextClose.index + nextClose[0].length;
        }
        innerPos = nextClose.index + nextClose[0].length;
      }
    }
    
    if (closePos > 0) {
      // Check if this block is nested inside another block we already found
      const isNested = blocks.some(b => openTag.start > b.start && closePos <= b.end);
      if (!isNested) {
        // Extract id from attributes
        const idMatch = openTag.attrs.match(/id\s*=\s*["']([^"']+)["']/i);
        const id = idMatch ? idMatch[1] : `${openTag.tag}-${sectionIndex}`;
        
        blocks.push({
          tag: openTag.tag,
          id: id,
          start: openTag.start,
          end: closePos,
          html: bodyHtml.slice(openTag.start, closePos).trim(),
          lineCount: bodyHtml.slice(openTag.start, closePos).split('\n').length
        });
        sectionIndex++;
      }
    }
  }
  
  // Sort blocks by position
  blocks.sort((a, b) => a.start - b.start);
  
  // Collect preamble (content before first block)
  if (blocks.length > 0) {
    preamble = bodyHtml.slice(0, blocks[0].start).trim();
  }
  
  // Collect content between blocks (inter-section content like marquees, dividers)
  const finalSections = [];
  
  // Add preamble as a special non-editable section if it exists
  if (preamble) {
    finalSections.push({
      id: '_preamble',
      tag: 'div',
      html: preamble,
      lineCount: preamble.split('\n').length,
      isEditable: false // Cursors, overlays — don't send to AI
    });
  }
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Add inter-section content
    if (i > 0) {
      const gap = bodyHtml.slice(blocks[i - 1].end, block.start).trim();
      if (gap) {
        finalSections.push({
          id: `_gap-${i}`,
          tag: 'div',
          html: gap,
          lineCount: gap.split('\n').length,
          isEditable: gap.split('\n').length > 3 // Only edit substantial gaps
        });
      }
    }
    
    finalSections.push({
      id: block.id,
      tag: block.tag,
      html: block.html,
      lineCount: block.lineCount,
      isEditable: true
    });
  }
  
  // Add trailing content after last block
  if (blocks.length > 0) {
    const trailing = bodyHtml.slice(blocks[blocks.length - 1].end).trim();
    if (trailing) {
      finalSections.push({
        id: '_trailing',
        tag: 'div',
        html: trailing,
        lineCount: trailing.split('\n').length,
        isEditable: false
      });
    }
  }
  
  // Fallback: if no sections found, return the whole body as one chunk
  if (finalSections.length === 0) {
    console.warn(`[Chunker] ⚠️ No semantic sections detected — falling back to single-chunk mode`);
    finalSections.push({
      id: 'full-body',
      tag: 'body',
      html: bodyHtml,
      lineCount: bodyHtml.split('\n').length,
      isEditable: true
    });
  }
  
  return finalSections;
}

/**
 * Main chunking function — splits a full HTML template into processable parts
 * @param {string} html - Complete HTML document
 * @returns {{ head: string, sections: Array, scripts: string, doctype: string, htmlAttrs: string, bodyAttrs: string, isChunked: boolean }}
 */
function chunkTemplate(html) {
  console.log(`[Chunker] 🔪 Starting template analysis (${html.split('\n').length} lines, ${(Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1)}KB)`);
  
  // 1. Extract DOCTYPE
  const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i);
  const doctype = doctypeMatch ? doctypeMatch[0] : '<!DOCTYPE html>';
  
  // 2. Extract <html> tag attributes
  const htmlTagMatch = html.match(/<html([^>]*)>/i);
  const htmlAttrs = htmlTagMatch ? htmlTagMatch[1].trim() : 'lang="en"';
  
  // 3. Extract <head>
  const { headContent } = extractHead(html);
  
  // 4. Extract <body> content
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  const bodyAttrs = bodyMatch ? bodyMatch[1].trim() : '';
  const bodyContent = bodyMatch ? bodyMatch[2] : '';
  
  // 5. Separate trailing scripts from body content
  const { bodyWithoutScripts, scripts } = extractTrailingScripts(bodyContent);
  
  // 6. Split body into sections
  const sections = splitIntoSections(bodyWithoutScripts);
  
  const editableSections = sections.filter(s => s.isEditable);
  
  console.log(`[Chunker] ✅ Found ${sections.length} total sections (${editableSections.length} editable):`);
  sections.forEach(s => {
    const marker = s.isEditable ? '✏️' : '🔒';
    console.log(`  ${marker} ${s.id} <${s.tag}> — ${s.lineCount} lines`);
  });
  
  return {
    doctype,
    htmlAttrs,
    head: headContent,
    bodyAttrs,
    sections,
    scripts,
    isChunked: true,
    stats: {
      totalSections: sections.length,
      editableSections: editableSections.length,
      totalLines: html.split('\n').length,
      totalBytes: Buffer.byteLength(html, 'utf-8')
    }
  };
}

/**
 * Reassemble customized sections back into a complete HTML document
 * @param {object} chunkResult - The result from chunkTemplate()
 * @param {string[]} customizedSections - Array of customized HTML for each editable section (in order)
 * @returns {string} Complete HTML document
 */
function reassembleTemplate(chunkResult, customizedSections) {
  const { doctype, htmlAttrs, head, bodyAttrs, sections, scripts } = chunkResult;
  
  let editableIndex = 0;
  const bodyParts = [];
  
  for (const section of sections) {
    if (section.isEditable && editableIndex < customizedSections.length) {
      bodyParts.push(customizedSections[editableIndex]);
      editableIndex++;
    } else {
      // Non-editable sections (preamble, gaps) stay unchanged
      bodyParts.push(section.html);
    }
  }
  
  const bodyContent = bodyParts.join('\n\n');
  
  const finalHtml = `${doctype}
<html ${htmlAttrs}>
<head>
${head}
</head>
<body${bodyAttrs ? ' ' + bodyAttrs : ''}>
${bodyContent}

${scripts}
</body>
</html>`;
  
  console.log(`[Chunker] 🧩 Reassembled ${customizedSections.length} customized sections + ${sections.length - editableIndex} preserved sections`);
  console.log(`[Chunker] 📦 Final output: ${finalHtml.split('\n').length} lines, ${(Buffer.byteLength(finalHtml, 'utf-8') / 1024).toFixed(1)}KB`);
  
  return finalHtml;
}

/**
 * Get a CSS-only context string from the <head> for use as context in AI prompts.
 * This gives the AI knowledge of the design system without sending the full head.
 * @param {string} headContent - The <head> content
 * @returns {string} Extracted CSS variables and key styles
 */
function extractStyleContext(headContent) {
  // Extract <style> blocks
  const styleBlocks = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(headContent)) !== null) {
    styleBlocks.push(match[1]);
  }
  
  if (styleBlocks.length === 0) return '';
  
  const fullCSS = styleBlocks.join('\n');
  
  // Extract just the :root variables and key design tokens
  const rootMatch = fullCSS.match(/:root\s*\{[^}]+\}/);
  const rootVars = rootMatch ? rootMatch[0] : '';
  
  // Also extract font-family references
  const fontFamilies = new Set();
  const fontRegex = /font-family\s*:\s*([^;}{]+)/gi;
  while ((match = fontRegex.exec(fullCSS)) !== null) {
    fontFamilies.add(match[1].trim());
  }
  
  return `/* Design System Context */\n${rootVars}\n/* Fonts used: ${[...fontFamilies].join(', ')} */`;
}

module.exports = {
  shouldChunk,
  chunkTemplate,
  reassembleTemplate,
  extractStyleContext,
  SAFE_LINE_THRESHOLD,
  SAFE_BYTE_THRESHOLD
};
