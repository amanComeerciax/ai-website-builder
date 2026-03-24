const fs = require('fs');
const path = require('path');

const masterFile = path.join(__dirname, 'stackforge-rulebook.md');
const content = fs.readFileSync(masterFile, 'utf8');

// The 9 specific section names we expect
const sections = [
  { id: 1, name: 'SECTION 1 \u2014 PHASE INJECTION MAP', filename: 'section-1-injection-map.md' },
  { id: 2, name: 'SECTION 2 \u2014 PROMPT PARSING RULES', filename: 'section-2-parse.md' },
  { id: 3, name: 'SECTION 3 \u2014 TYPOGRAPHY RULES', filename: 'section-3-typography.md' },
  { id: 4, name: 'SECTION 4 \u2014 COLOR SYSTEM RULES', filename: 'section-4-color.md' },
  { id: 5, name: 'SECTION 5 \u2014 SPACING, LAYOUT & ANIMATION RULES', filename: 'section-5-layout.md' },
  { id: 6, name: 'SECTION 6 \u2014 TRACK A: HTML GENERATION RULES', filename: 'section-6-track-a.md' },
  { id: 7, name: 'SECTION 7 \u2014 TRACK B: NEXT.JS GENERATION RULES', filename: 'section-7-track-b.md' },
  { id: 8, name: 'SECTION 8 \u2014 CODE QUALITY RULES', filename: 'section-8-quality.md' },
  { id: 9, name: 'SECTION 9 \u2014 NEXT.JS COMPONENT LIBRARY', filename: 'section-9-components.md' }
];

// We will split the file by '## SECTION '
const parts = content.split(/^## SECTION /m);

// First element is the intro text
const intro = parts.shift();
const disclaimer = intro.trim() + '\n\n';

for (let part of parts) {
  // Figure out which section string this is
  const headerLine = part.split('\n')[0].trim();
  const idMatch = headerLine.match(/^(\d)/);
  if (!idMatch) continue;

  const id = parseInt(idMatch[1], 10);
  const sectionObj = sections.find(s => s.id === id);

  if (sectionObj) {
    const fullContent = `## SECTION ${part.trim()}\n`;
    fs.writeFileSync(path.join(__dirname, sectionObj.filename), fullContent, 'utf8');
    console.log(`Wrote ${sectionObj.filename}`);
  }
}
