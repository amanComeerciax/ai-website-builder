/**
 * migrate-templates.js
 * 
 * One-time migration script:
 *   1. Reads all HTML templates from server/templates/raw/
 *   2. Auto-generates a description + keywords for each using the AI
 *   3. Stores them in MongoDB as Template documents
 * 
 * Usage: node scripts/migrate-templates.js
 *
 * After running this, the local /templates/raw/ folder is no longer needed
 * for production — the app reads templates from MongoDB instead.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('❌ MONGODB_URI not set in .env'); process.exit(1); }
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
};

// We'll import these after dotenv is loaded
let Template, callModel;

async function analyzeTemplate(name, html) {
  // Extract key signals from the HTML to help the AI (avoids sending full 40K)
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';
  
  // Get first 200 chars of visible text (headings, nav links, etc.)
  const headings = [];
  const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let m;
  while ((m = hRegex.exec(html)) !== null && headings.length < 8) {
    headings.push(m[1].replace(/<[^>]+>/g, '').trim());
  }
  
  const navLinks = [];
  const navRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = navRegex.exec(html)) !== null && navLinks.length < 10) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 1 && text.length < 30) navLinks.push(text);
  }

  const classNames = [...new Set((html.match(/class="([^"]+)"/g) || []).map(c => c.replace(/class="/, '').replace(/"/, '')))].slice(0, 20);
  
  const context = `
FILENAME: ${name}
TITLE: ${title}
HEADINGS: ${headings.join(', ')}
NAV_LINKS: ${navLinks.join(', ')}
KEY_CLASSES: ${classNames.join(', ')}
HTML_SIZE: ${html.length} chars
`.trim();

  const systemPrompt = `Analyze this website template and provide:
1. A short description (max 15 words) of what kind of website this template is best suited for.
2. A comma-separated list of 10-15 keywords/industries this template would match.

Reply in this EXACT JSON format, nothing else:
{"description": "...", "keywords": "keyword1, keyword2, keyword3, ..."}`;

  try {
    const result = await callModel('parse_prompt', context, systemPrompt);
    let raw = result.content.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const parsed = JSON.parse(raw);
    return {
      description: parsed.description || 'General purpose website',
      keywords: parsed.keywords || ''
    };
  } catch (err) {
    console.warn(`  ⚠️ AI analysis failed for ${name}: ${err.message}`);
    return {
      description: 'General purpose website',
      keywords: ''
    };
  }
}

async function migrateTemplates() {
  await connectDB();
  
  Template = require('../server/models/Template');
  callModel = require('../server/services/modelRouter').callModel;

  const rawDir = path.join(__dirname, '..', 'server', 'templates', 'raw');
  
  if (!fs.existsSync(rawDir)) {
    console.error('❌ Templates directory not found:', rawDir);
    process.exit(1);
  }
  
  const htmlFiles = fs.readdirSync(rawDir).filter(f => f.endsWith('.html'));
  console.log(`\n📦 Found ${htmlFiles.length} templates to migrate:\n`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const file of htmlFiles) {
    const name = file.replace('.html', '');
    
    // Check if already exists
    const existing = await Template.findOne({ name });
    if (existing) {
      console.log(`  ⏭️  ${file} — already in MongoDB, skipping`);
      skipped++;
      continue;
    }
    
    console.log(`  📄 ${file} — reading & analyzing...`);
    const html = fs.readFileSync(path.join(rawDir, file), 'utf-8');
    
    // Auto-generate description using AI
    const { description, keywords } = await analyzeTemplate(file, html);
    
    console.log(`     → "${description}"`);
    console.log(`     → Keywords: ${keywords.substring(0, 80)}...`);
    
    await Template.create({
      name,
      slug: name, // satisfy existing unique DB index
      description,
      keywords,
      htmlContent: html,
      sizeBytes: Buffer.byteLength(html, 'utf-8'),
      isActive: true
    });
    
    console.log(`  ✅ Saved "${name}" to MongoDB\n`);
    imported++;
    
    // Small delay to avoid rate limits on the AI model
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n🎉 Migration complete! ${imported} imported, ${skipped} skipped.`);
  console.log(`\n💡 You can now safely remove server/templates/raw/ from your codebase.`);
  console.log(`   Templates are served from MongoDB going forward.\n`);
  
  await mongoose.disconnect();
}

migrateTemplates().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
