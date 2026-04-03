const fs = require('fs');
const path = require('path');

const SNIPPETS_DIR = path.join(__dirname, '..', 'snippets');

/**
 * In-memory usage tracking for anti-repetition
 */
const usageHistory = [];
const MAX_HISTORY = 10;

/**
 * Loads all snippet HTML templates and their metadata from the filesystem
 */
function loadSnippets() {
  const snippets = {};
  const categories = fs.readdirSync(SNIPPETS_DIR).filter(file => {
    const fullPath = path.join(SNIPPETS_DIR, file);
    return fs.statSync(fullPath).isDirectory() && file !== 'node_modules';
  });

  for (const category of categories) {
    const categoryPath = path.join(SNIPPETS_DIR, category);
    const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.html'));

    for (const file of files) {
      const id = file.replace('.html', '');
      const content = fs.readFileSync(path.join(categoryPath, file), 'utf8');

      // Extract metadata from a comment block at the top
      let meta = { name: id, bestFor: 'general use' };
      const metaMatch = content.match(/<!-- META: (.*?) -->/);
      if (metaMatch && metaMatch[1]) {
        try {
          meta = { ...meta, ...JSON.parse(metaMatch[1]) };
        } catch (e) {
          console.warn(`[SnippetRegistry] Could not parse meta for ${id}`);
        }
      }

      // Auto-extract required variables
      const varsMatch = content.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
      let variables = [];
      if (varsMatch) {
         variables = [...new Set(varsMatch.map(v => v.replace(/[{}]/g, '')))];
         // Filter out global design tokens
         variables = variables.filter(v => !['bg', 'surface', 'accent', 'text', 'textDim', 'border', 'fontHeading', 'fontBody', 'accentHover'].includes(v));
      }

      snippets[id] = { id, category, content, variables, ...meta };
    }
  }

  return snippets;
}

const snippetCache = loadSnippets();

/**
 * Provides a catalog of available snippets for the AI prompt
 */
function getSnippetCatalog() {
  const catalog = [];
  for (const [id, snippet] of Object.entries(snippetCache)) {
    catalog.push({
      id: snippet.id,
      category: snippet.category,
      name: snippet.name,
      bestFor: snippet.bestFor,
      variables: snippet.variables
    });
  }
  return catalog;
}

/**
 * Returns a RANDOMIZED subset of snippets for each category.
 * This forces the AI to choose from different options each time.
 * 
 * @param {string[]} categories - Array of category names to include
 * @param {number} maxPerCategory - Max snippets per category (default 2-3)
 * @returns {Array} Randomly filtered catalog
 */
function getRandomizedCatalog(categories, maxPerCategory = 3) {
  const catalog = getSnippetCatalog();
  const result = [];
  
  for (const cat of categories) {
    const catSnippets = catalog.filter(s => s.category === cat);
    
    if (catSnippets.length <= maxPerCategory) {
      // If category has fewer snippets than max, include all
      result.push(...catSnippets);
    } else {
      // Shuffle and take random subset
      const shuffled = shuffleArray([...catSnippets]);
      
      // Avoid recently used snippets where possible
      const recentIds = getRecentlyUsedIds();
      
      // FOR NAV: Be even stricter to ensure headers change
      if (cat === 'nav') {
        const fresh = shuffled.filter(s => !recentIds.includes(s.id));
        const selected = fresh.length > 0 ? fresh.slice(0, 1) : shuffled.slice(0, 1);
        result.push(...selected);
        continue;
      }

      const fresh = shuffled.filter(s => !recentIds.includes(s.id));
      const stale = shuffled.filter(s => recentIds.includes(s.id));
      
      // Prefer fresh snippets, fill remaining with stale ones
      const selected = [...fresh, ...stale].slice(0, maxPerCategory);
      result.push(...selected);
    }
  }
  
  return result;
}

/**
 * Track which snippets were used in a generation
 * @param {string[]} snippetIds - Array of snippet IDs that were used
 */
function trackUsage(snippetIds) {
  usageHistory.push({
    ids: snippetIds,
    timestamp: Date.now()
  });
  
  // Keep only last N entries
  while (usageHistory.length > MAX_HISTORY) {
    usageHistory.shift();
  }
  
  console.log(`[SnippetRegistry] 📊 Tracked usage: [${snippetIds.join(', ')}] (${usageHistory.length} in history)`);
}

/**
 * Get IDs of recently used snippets (for anti-repetition)
 * @returns {string[]}
 */
function getRecentlyUsedIds() {
  const recentIds = new Set();
  // Look at last 3 generations
  const recentEntries = usageHistory.slice(-3);
  for (const entry of recentEntries) {
    entry.ids.forEach(id => recentIds.add(id));
  }
  return [...recentIds];
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns raw HTML template string for a snippet
 */
function getSnippet(id) {
  return snippetCache[id]?.content || null;
}

/**
 * Replaces {{variables}} and returns final HTML
 * If a variable is missing, generates a smart fallback instead of leaving it blank
 */
function renderSnippet(id, variables, designTokens = {}) {
  const rawHtml = getSnippet(id);
  if (!rawHtml) return `<!-- Snippet Not Found: ${id} -->`;

  // Merge section-specific content with global design tokens
  const mergedVars = { ...designTokens, ...variables };

  // Log missing variables for debugging
  const templateVars = rawHtml.match(/\{\{([^}]+)\}\}/g) || [];
  const required = [...new Set(templateVars.map(v => v.replace(/[{}]/g, '').trim()))];
  const designTokenKeys = ['bg', 'surface', 'accent', 'text', 'textDim', 'border', 'fontHeading', 'fontBody', 'accentHover'];
  const contentVars = required.filter(v => !designTokenKeys.includes(v));
  const missing = contentVars.filter(v => !mergedVars[v] || mergedVars[v] === '');
  
  if (missing.length > 0) {
    console.warn(`[SnippetRegistry] ⚠️ Snippet "${id}" missing ${missing.length} vars: [${missing.join(', ')}] — using fallbacks`);
  }

  let rendered = rawHtml;

  // Replace variables with content OR smart fallbacks
  rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, param) => {
    const key = param.trim();
    const value = mergedVars[key];
    if (value !== undefined && value !== '') return value;
    
    // Generate smart fallback based on variable name pattern
    return generateFallback(key, id);
  });

  return rendered;
}

/**
 * Generate intelligent fallback content based on variable naming patterns.
 * This ensures sections never appear blank even if AI misses variables.
 */
function generateFallback(varName, snippetId) {
  const v = varName.toLowerCase();
  
  // --- Headings & Titles ---
  if (v === 'heading') return 'Discover What\'s Possible';
  if (v === 'subtext') return 'Built with precision, designed for impact. Experience the difference.';
  if (v === 'badgetext') return 'New';
  
  // --- Buttons ---
  if (v === 'ctatext') return 'Get Started';
  if (v === 'ctalink') return '#start';
  if (v === 'secondaryctatext') return 'Learn More';
  if (v === 'secondaryctalink') return '#about';
  if (v === 'submittext') return 'Send Message';
  if (v === 'buttontext') return 'Subscribe';
  
  // --- Brand ---
  if (v === 'brand') return 'Brand';
  if (v === 'footerdescription') return 'Building the future, one pixel at a time.';
  if (v === 'footernote') return 'No credit card required. Start free.';
  if (v === 'emailplaceholder') return 'Enter your email';
  if (v === 'nameplaceholder') return 'Your full name';
  if (v === 'messageplaceholder') return 'Tell us about your project...';
  
  // --- Items (pattern: itemNTitle, itemNDesc — used in split-text snippets) ---
  const itemMatch = v.match(/item(\d+)(title|desc)/);
  if (itemMatch) {
    const n = parseInt(itemMatch[1]);
    const type = itemMatch[2];
    const titles = ['Powerful Analytics Dashboard', 'Seamless Team Collaboration'];
    const descs = ['Gain deep insights into your data with real-time dashboards. Make informed decisions faster with beautiful, interactive visualizations.', 'Work together effortlessly. Share, comment, and collaborate in real-time with your entire team, no matter where they are.'];
    if (type === 'title') return titles[(n - 1) % titles.length];
    if (type === 'desc') return descs[(n - 1) % descs.length];
  }
  
  // --- Feature Names (pattern: featureNName — used in pricing-table) ---
  const featureNameMatch = v.match(/feature(\d+)name/);
  if (featureNameMatch) {
    const names = ['Unlimited Projects', 'Advanced Analytics', 'Custom Integrations', 'Priority Support', 'API Access', 'SSO Authentication'];
    const n = parseInt(featureNameMatch[1]);
    return names[(n - 1) % names.length];
  }
  
  // --- Features (pattern: featureNTitle, featureNDesc) ---
  const featureMatch = v.match(/feature(\d+)(title|desc)/);
  if (featureMatch) {
    const n = parseInt(featureMatch[1]);
    const type = featureMatch[2];
    const titles = ['Lightning Performance', 'Enterprise Security', 'Smart Automation', 'Real-time Analytics', 'Cloud Native', 'AI Powered'];
    const descs = ['Optimized for speed at every layer of the stack.', 'Bank-grade encryption and compliance built in.', 'Automate repetitive tasks and focus on what matters.', 'Monitor everything in real-time with live dashboards.', 'Scale infinitely with cloud-native architecture.', 'Harness the power of machine learning.'];
    if (type === 'title') return titles[(n - 1) % titles.length];
    if (type === 'desc') return descs[(n - 1) % descs.length];
  }
  
  // --- Stats (pattern: statNValue, statNLabel, statNDesc) ---
  const statMatch = v.match(/stat(\d+)(value|label|desc)/);
  if (statMatch) {
    const n = parseInt(statMatch[1]);
    const type = statMatch[2];
    const values = ['10,000+', '99.9%', '50M+', '4.9/5'];
    const labels = ['Users', 'Uptime', 'Requests', 'Rating'];
    const descs = ['Active monthly users', 'Service availability', 'Processed this month', 'Customer satisfaction'];
    if (type === 'value') return values[(n - 1) % values.length];
    if (type === 'label') return labels[(n - 1) % labels.length];
    if (type === 'desc') return descs[(n - 1) % descs.length];
  }
  
  // --- Testimonials (pattern: quoteN, authorNName, authorNRole, authorNInitial) ---
  const quoteMatch = v.match(/quote(\d*)/);
  if (quoteMatch) return 'This product completely transformed how we work. The results speak for themselves — 3x faster delivery with half the effort.';
  
  const authorNameMatch = v.match(/author(\d*)(name)/);
  if (authorNameMatch) {
    const names = ['Sarah Chen', 'Marcus Johnson', 'Emily Rodriguez'];
    const n = parseInt(authorNameMatch[1] || '1');
    return names[(n - 1) % names.length];
  }
  
  const authorRoleMatch = v.match(/author(\d*)(role)/);
  if (authorRoleMatch) {
    const roles = ['CEO, TechCorp', 'CTO, DataFlow', 'VP Product, ScaleUp'];
    const n = parseInt(authorRoleMatch[1] || '1');
    return roles[(n - 1) % roles.length];
  }
  
  const authorInitialMatch = v.match(/author(\d*)(initial)/);
  if (authorInitialMatch) {
    const initials = ['SC', 'MJ', 'ER'];
    const n = parseInt(authorInitialMatch[1] || '1');
    return initials[(n - 1) % initials.length];
  }
  
  if (v === 'quote') return 'This changed everything for our team. We went from struggling to thriving in just weeks.';
  if (v === 'authorinitial') return 'SC';
  if (v === 'authorname') return 'Sarah Chen';
  if (v === 'authorrole') return 'CEO, TechCorp';
  
  // --- Pricing (pattern: planNName, planNPrice, planNDesc, planNCta, planNFeatureN) ---
  const planMatch = v.match(/plan(\d+)(name|price|desc|cta)/);
  if (planMatch) {
    const n = parseInt(planMatch[1]);
    const type = planMatch[2];
    if (type === 'name') return ['Starter', 'Professional', 'Enterprise'][n - 1] || 'Plan';
    if (type === 'price') return ['$29', '$99', 'Custom'][n - 1] || '$49';
    if (type === 'desc') return ['Perfect for getting started.', 'For growing teams and businesses.', 'For large-scale operations.'][n - 1] || 'Great value plan.';
    if (type === 'cta') return ['Start Free', 'Upgrade Now', 'Contact Sales'][n - 1] || 'Get Started';
  }
  
  const planFeatureMatch = v.match(/plan(\d+)feature(\d+)/);
  if (planFeatureMatch) {
    const features = ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom integrations', 'API access', 'Team collaboration'];
    const n = parseInt(planFeatureMatch[2]);
    return features[(n - 1) % features.length];
  }
  
  // --- FAQ (pattern: faqNQuestion, faqNAnswer) ---
  const faqMatch = v.match(/faq(\d+)(question|answer)/);
  if (faqMatch) {
    const n = parseInt(faqMatch[1]);
    const type = faqMatch[2];
    const questions = ['How do I get started?', 'Is there a free trial?', 'Can I cancel anytime?', 'What support is included?', 'How secure is it?'];
    const answers = [
      'Simply sign up for a free account and follow our quick-start guide. You\'ll be up and running in under 5 minutes.',
      'Yes! We offer a 14-day free trial with full access to all features. No credit card required.',
      'Absolutely. You can cancel your subscription at any time with no penalties or hidden fees.',
      'All plans include email support. Pro and Enterprise plans include priority chat and phone support.',
      'We use bank-grade encryption and are SOC 2 compliant. Your data is always secure and private.'
    ];
    if (type === 'question') return questions[(n - 1) % questions.length];
    if (type === 'answer') return answers[(n - 1) % answers.length];
  }
  
  // --- Team (pattern: memberNName, memberNRole, etc.) ---
  const memberMatch = v.match(/member(\d+)(name|role|bio|initial)/);
  if (memberMatch) {
    const n = parseInt(memberMatch[1]);
    const type = memberMatch[2];
    const names = ['Alex Rivera', 'Jordan Kim', 'Sam Patel', 'Morgan Lee'];
    const roles = ['Chief Executive Officer', 'Head of Engineering', 'Lead Designer', 'VP of Growth'];
    const bios = ['Visionary leader with 15+ years building products.', 'Full-stack architect obsessed with scale.', 'Award-winning designer focused on delight.', 'Growth expert who scaled 3 startups.'];
    const initials = ['AR', 'JK', 'SP', 'ML'];
    if (type === 'name') return names[(n - 1) % names.length];
    if (type === 'role') return roles[(n - 1) % roles.length];
    if (type === 'bio') return bios[(n - 1) % bios.length];
    if (type === 'initial') return initials[(n - 1) % initials.length];
  }
  
  // --- Gallery/Images ---
  const imageMatch = v.match(/image(\d+)(title|category)/);
  if (imageMatch) {
    const n = parseInt(imageMatch[1]);
    const type = imageMatch[2];
    const titles = ['Project Alpha', 'Design System', 'Dashboard UI', 'Mobile App', 'Brand Identity', 'Analytics Suite'];
    const cats = ['Web Design', 'UI/UX', 'Product', 'Mobile', 'Branding', 'Data Viz'];
    if (type === 'title') return titles[(n - 1) % titles.length];
    if (type === 'category') return cats[(n - 1) % cats.length];
  }
  
  // --- Logos ---
  const logoMatch = v.match(/logo(\d+)/);
  if (logoMatch) {
    const n = parseInt(logoMatch[1]);
    const logos = [
      'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-icon.png',
      'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/apple-icon.png',
      'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/amazon-icon.png',
      'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/microsoft-icon.png',
      'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/meta-icon.png',
      'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/netflix-icon.png'
    ];
    return logos[(n - 1) % logos.length];
  }
  
  // --- Steps ---
  const stepMatch = v.match(/step(\d+)(title|desc)/);
  if (stepMatch) {
    const n = parseInt(stepMatch[1]);
    const type = stepMatch[2];
    const titles = ['Sign Up', 'Configure', 'Launch'];
    const descs = ['Create your account in seconds.', 'Customize settings to fit your workflow.', 'Go live and start seeing results immediately.'];
    if (type === 'title') return titles[(n - 1) % titles.length];
    if (type === 'desc') return descs[(n - 1) % descs.length];
  }
  
  // --- Contact ---
  if (v === 'address') return '123 Innovation Blvd, San Francisco, CA';
  if (v === 'email') return 'hello@company.com';
  if (v === 'phone') return '+1 (555) 123-4567';
  if (v === 'description') return 'We build tools that empower teams to do their best work.';
  
  // --- IMAGES: Curated Unsplash Photo URLs ---
  // Hero images
  if (v === 'heroimage') return 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=1000&fit=crop&q=80';
  
  // About images
  if (v === 'aboutimage') return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80';
  
  // Feature/product images (used in split-text, list-icon, sticky-scroll)
  if (v === 'featureimage') return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80';
  
  // Item images (features-split-text)
  const itemImageMatch = v.match(/item(\d+)image/);
  if (itemImageMatch) {
    const urls = [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&fit=crop&q=80'
    ];
    const n = parseInt(itemImageMatch[1]);
    return urls[(n - 1) % urls.length];
  }
  
  // Gallery image URLs (gallery-masonry)
  const imageUrlMatch = v.match(/image(\d+)url/);
  if (imageUrlMatch) {
    const urls = [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=450&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=450&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=450&fit=crop&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=450&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=450&fit=crop&q=80'
    ];
    const n = parseInt(imageUrlMatch[1]);
    return urls[(n - 1) % urls.length];
  }
  
  // --- Catch-all ---
  console.warn(`[SnippetRegistry] No fallback for variable: "${varName}" in snippet "${snippetId}"`);
  return '';
}

module.exports = {
  getSnippetCatalog,
  getRandomizedCatalog,
  getSnippet,
  renderSnippet,
  trackUsage,
  getRecentlyUsedIds
};
