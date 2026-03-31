require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { callModel } = require('../server/services/modelRouter.js');
const { getComponentCatalog } = require('../server/component-kit/registry.js');

const TEMPLATES_DIR = path.join(__dirname, '..', 'server', 'templates');

// The list of categories the user wants to populate
const CATEGORIES = [
  'coffee-shop', 'blog', 'portfolio', 'saas', 'hospital', 'restaurant', 
  'ecommerce', 'fitness', 'real-estate', 'agency', 'medical', 'education'
];

// Ensure all directories exist
CATEGORIES.forEach(cat => {
  const dir = path.join(TEMPLATES_DIR, cat);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function generateTemplate(category, index) {
  const catalog = getComponentCatalog();
  
  const systemPrompt = `You are an expert web designer creating a pristine structural JSON template for a "${category}" website.
This template will be used as a master blueprint for thousands of other websites, so the component combinations and layout must be flawless, logical, and highly converting.

AVAILABLE COMPONENTS:
${catalog.map(c => `- ${c.name} (variants: ${c.variants.join(', ')})
  Required: ${c.requiredProps.join(', ')}
  Optional: ${c.optionalProps.join(', ')}`).join('\n')}

RULES for template ${index}:
1. Start with NavBar and end with FooterSection.
2. Include at least 6-8 sections total.
3. Choose a unique vibe (e.g. minimalist, bold, elegant) and write placeholder content that fits that vibe.
4. For images, use "https://placehold.co/600x400/1a1a2e/ffffff?text=[Image_Description]" instead of broken urls.
5. Return ONLY valid JSON, no markdown blocks.

{
  "meta": { "title": "Template ${index}", "description": "..." },
  "sections": [
    { "component": "NavBar", "variant": "...", "props": { ... } }
  ]
}
`;

  try {
    console.log(`⏳ Generating template ${index}/15 for ${category}...`);
    const result = await callModel('parse_prompt', `Generate a completely unique and highly premium layout template for a ${category}`, systemPrompt);
    
    let rawContent = result.content.trim();
    rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    
    // Validate JSON
    const parsed = JSON.parse(rawContent);
    if (!parsed.sections) throw new Error("Missing sections in JSON");

    const filePath = path.join(TEMPLATES_DIR, category, `template-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
    console.log(`✅ Saved template to ${filePath}`);
    
  } catch (err) {
    console.error(`❌ Failed to generate template for ${category}:`, err.message);
  }
}

async function runSeeder(category, count) {
  console.log(`\n🚀 Starting template seeder for category: ${category} (Count: ${count})`);
  for (let i = 1; i <= count; i++) {
    await generateTemplate(category, i);
    // Add a tiny delay to avoid hitting model rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`\n🎉 Finished seeding ${category} templates!`);
}

// Check args
const targetCategory = process.argv[2];
const count = parseInt(process.argv[3]) || 5;

if (!targetCategory || !CATEGORIES.includes(targetCategory)) {
  console.log(`Usage: node scripts/seed-templates.js <category> <count>`);
  console.log(`Available categories: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}

runSeeder(targetCategory, count);
