/**
 * Template Assembler — Snippet Architecture
 * Stitches dynamic HTML snippets and design tokens together.
 * Includes validation to GUARANTEE no blank sections.
 */

const { renderToHTML } = require('../component-kit/html-renderer.js');
const { renderSnippet, getSnippetCatalog } = require('../component-kit/snippetRegistry.js');
const { exportToNextJs } = require('./nextjsExporter.js');
const { planLayout, buildFallbackLayout } = require('./layoutPlanner.js');

async function assemble(enrichedSpec, onProgress = () => {}, previousLayoutSpec = null) {
  // Step 1: Plan layout via AI
  onProgress({ event: 'thinking', message: 'Selecting layout snippets...' });

  let layoutSpec;
  try {
    layoutSpec = await planLayout(enrichedSpec, previousLayoutSpec);
    onProgress({ event: 'log', type: 'Reading', file: 'snippet selection', message: `Picked ${layoutSpec?.sections?.length || 0} layouts` });
  } catch (e) {
    console.warn('[Assembler] Layout planning failed, using fallback:', e.message);
    layoutSpec = buildFallbackLayout(enrichedSpec);
    onProgress({ event: 'log', type: 'Reading', file: 'fallback layout', message: 'Using default layout' });
  }

  // VALIDATION 1: Ensure layoutSpec has sections
  if (!layoutSpec?.sections || layoutSpec.sections.length === 0) {
    console.warn('[Assembler] ⚠️ Empty sections array, rebuilding with fallback');
    layoutSpec = buildFallbackLayout(enrichedSpec);
  }

  // VALIDATION 2: Ensure every section has a valid snippetId that exists in registry
  const catalog = getSnippetCatalog();
  const validIds = new Set(catalog.map(s => s.id));
  
  layoutSpec.sections = layoutSpec.sections.filter(section => {
    if (!section.snippetId) {
      console.warn('[Assembler] ⚠️ Section missing snippetId, skipping');
      return false;
    }
    if (!validIds.has(section.snippetId)) {
      console.warn(`[Assembler] ⚠️ Unknown snippetId "${section.snippetId}", skipping`);
      return false;
    }
    return true;
  });

  // VALIDATION 3: If too few sections remain after filtering, pad with fallback
  if (layoutSpec.sections.length < 3) {
    console.warn('[Assembler] ⚠️ Too few valid sections, using fallback layout');
    layoutSpec = buildFallbackLayout(enrichedSpec);
  }

  // Fallback tokens if AI fails to provide them
  const designTokens = layoutSpec.designTokens || {
    bg: '#09090b', surface: '#18181b', accent: '#3b82f6',
    accentHover: '#2563eb', text: '#fafafa', textDim: '#a1a1aa',
    border: 'rgba(255,255,255,0.1)', fontHeading: 'Inter', fontBody: 'Inter'
  };

  // VALIDATION 4: Ensure content object exists for every section
  layoutSpec.sections.forEach(section => {
    if (!section.content || typeof section.content !== 'object') {
      section.content = {};
    }
  });

  // Step 2: Render individual snippets using the Registry
  onProgress({ event: 'thinking', message: 'Assembling snippets...' });
  
  let snippetsHTML = '';
  for (const section of layoutSpec.sections) {
    onProgress({ event: 'log', type: 'Creating', file: `${section.snippetId}.html` });
    
    // renderSnippet now has built-in fallbacks for ALL missing variables
    const populatedSnippet = renderSnippet(section.snippetId, section.content || {}, designTokens);
    snippetsHTML += populatedSnippet + '\n';
  }

  // VALIDATION 5: Check rendered HTML — if total output is suspiciously small, use fallback
  if (snippetsHTML.length < 500) {
    console.warn('[Assembler] ⚠️ Rendered HTML too small, using fallback');
    const fallback = buildFallbackLayout(enrichedSpec);
    snippetsHTML = '';
    for (const section of fallback.sections) {
      snippetsHTML += renderSnippet(section.snippetId, section.content || {}, designTokens) + '\n';
    }
  }

  // Step 3: Wrap the assembled snippets in the standard HTML shell
  const themeConfig = {
    colorScheme: designTokens,
    fontPair: {
      heading: designTokens.fontHeading || 'Inter',
      body: designTokens.fontBody || 'Inter'
    }
  };

  const html = renderToHTML(snippetsHTML, layoutSpec, themeConfig);

  // Step 4: Generate Next.js Export Files
  onProgress({ event: 'thinking', message: 'Generating Next.js project files...' });
  const nextJsFiles = exportToNextJs(snippetsHTML, layoutSpec);

  // Step 5: Output structured result
  const files = { 
    'index.html': html,
    ...nextJsFiles
  };
  
  console.log(`[Assembler] ✅ Assembly complete — ${layoutSpec.sections.length} snippets stitched, ${html.length} chars HTML, ${Object.keys(nextJsFiles).length} Next.js files generated`);

  return {
    html,
    layoutSpec,
    files,
    previewType: 'srcdoc',
    meta: layoutSpec.meta || {}
  };
}

module.exports = { assemble };
