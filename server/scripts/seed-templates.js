require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Template = require('../models/Template');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment.");
  process.exit(1);
}

const starterFilesHTML = [
  { 
    path: 'index.html', 
    isFolder: false,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local Coffee Shop</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#faf8f5] text-stone-900 font-sans">
  <nav class="flex items-center justify-between p-6 max-w-7xl mx-auto">
    <div class="text-2xl font-bold tracking-tighter">Brew&Co.</div>
    <div class="space-x-8 text-sm font-medium">
      <a href="#" class="hover:text-amber-700 transition">Menu</a>
      <a href="#" class="hover:text-amber-700 transition">Location</a>
      <a href="#" class="hover:text-amber-700 transition">About</a>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">
    <div class="flex-1 space-y-8">
      <h1 class="text-6xl font-bold leading-tight tracking-tighter text-stone-800">
        Artisan Coffee.<br/>Locally Roasted.
      </h1>
      <p class="text-xl text-stone-600 max-w-md">
        Experience the finest single-origin beans, roasted right here in the neighborhood.
      </p>
      <button class="bg-stone-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-amber-800 transition shadow-lg">
        Order Ahead
      </button>
    </div>
    <div class="flex-1 h-[500px] w-full relative rounded-3xl overflow-hidden shadow-2xl">
      <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000" class="absolute inset-0 w-full h-full object-cover" alt="Pouring coffee" />
    </div>
  </main>
</body>
</html>` 
  }
];

const starterFilesNextjs = [
  { path: 'package.json', isFolder: false, content: '{\n  "dependencies": {\n    "next": "^14.0.0",\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0",\n    "lucide-react": "^0.330.0",\n    "clsx": "^2.1.0",\n    "tailwind-merge": "^2.2.0"\n  },\n  "devDependencies": {\n    "tailwindcss": "^3.4.0",\n    "postcss": "^8.4.31",\n    "autoprefixer": "^10.4.17"\n  }\n}' },
  { path: 'postcss.config.js', isFolder: false, content: 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {}, }, }' },
  { path: 'tailwind.config.js', isFolder: false, content: '/** @type {import("tailwindcss").Config} */\nmodule.exports = { content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"], theme: { extend: { colors: { background: "var(--background)", foreground: "var(--foreground)", primary: "var(--primary)" } }, }, plugins: [], }' },
  { path: 'app', isFolder: true, content: '' },
  { path: 'components', isFolder: true, content: '' },
  { 
    path: 'app/globals.css', 
    isFolder: false, 
    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --background: #09090b;\n  --foreground: #fafafa;\n  --primary: #3b82f6;\n}\n\nbody {\n  background-color: var(--background);\n  color: var(--foreground);\n}` 
  },
  { 
    path: 'app/layout.js', 
    isFolder: false, 
    content: `import './globals.css';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body className="antialiased min-h-screen">\n        {children}\n      </body>\n    </html>\n  );\n}` 
  },
  { 
    path: 'app/page.js', 
    isFolder: false, 
    content: `import Hero from '../components/Hero';\n\nexport default function Home() {\n  return (\n    <main>\n      <Hero />\n    </main>\n  );\n}` 
  },
  {
    path: 'components/Hero.js',
    isFolder: false,
    content: `'use client';\nimport { ArrowRight } from 'lucide-react';\n\nexport default function Hero() {\n  return (\n    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">\n      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm border rounded-full text-blue-400 border-blue-400/30 bg-blue-400/10">\n        v2.0 is live <ArrowRight size={14} />\n      </div>\n      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-vr from-white to-gray-400">\n        Ship faster than your competition.\n      </h1>\n      <p className="text-lg text-zinc-400 mb-10 max-w-2xl">\n        The modern React framework for building high-conversion landing pages in minutes.\n      </p>\n      <div className="flex items-center gap-4">\n        <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">\n          Start Building Free\n        </button>\n        <button className="px-6 py-3 bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium rounded-lg hover:bg-zinc-700 transition">\n          View Documentation\n        </button>\n      </div>\n    </div>\n  );\n}`
  }
];

const templates = [
  {
    name: "Modern SaaS Landing Page",
    slug: "saas-landing-page",
    description: "High-conversion landing page with hero, features, comparison tables, and modern bento grids.",
    track: "nextjs",
    features: ["Framer Motion", "Dark Mode", "Bento Grid"],
    files: starterFilesNextjs
  },
  {
    name: "Local Coffee Shop",
    slug: "local-coffee-shop",
    description: "Warm, image-heavy single page site for a physical business. Includes menu, hours, and location.",
    track: "html",
    features: ["Vanilla JS", "Scroll Reveal", "Responsive Image Grid"],
    files: starterFilesHTML
  },
  {
    name: "Creative Agency Portfolio",
    slug: "creative-agency-portfolio",
    description: "Bold typography and masonry layout perfect for agencies showcasing visual project work.",
    track: "nextjs",
    features: ["Masonry Grid", "Custom Cursors", "Page Transitions"],
    files: starterFilesNextjs
  },
  {
    name: "Developer Resume",
    slug: "developer-resume",
    description: "Minimalist, clean text-based portfolio focusing on GitHub contribution style graphs and tech stacks.",
    track: "html",
    features: ["Print-friendly", "Timeline UI", "Ultra-fast TTFB"],
    files: starterFilesHTML
  },
  {
    name: "E-Commerce Storefront",
    slug: "e-commerce-storefront",
    description: "Product catalog, filtering sidebar, dynamic routing, and shopping cart skeleton state.",
    track: "nextjs",
    features: ["State Management", "Dynamic Routes", "Filter Sidebars"],
    files: starterFilesNextjs
  },
  {
    name: "Waitlist Capture",
    slug: "waitlist-capture",
    description: "High urgency, single centered card capturing emails for upcoming product launches.",
    track: "html",
    features: ["Micro-animations", "Form Validation", "Dark Aesthetic"],
    files: starterFilesHTML
  },
  {
    name: "Real Estate Listings",
    slug: "real-estate-listings",
    description: "Property cards with image carousels, detailed layouts, and maps integration placeholders.",
    track: "nextjs",
    features: ["Image Carousels", "Advanced Filters", "Modal Views"],
    files: starterFilesNextjs
  },
  {
    name: "Event Registration",
    slug: "event-registration",
    description: "Schedule timeline, speaker biographies, and ticket purchasing tiers in a vibrant layout.",
    track: "html",
    features: ["Sticky Tabs", "Pricing Tables", "Countdown Timer"],
    files: starterFilesHTML
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    await Template.deleteMany({});
    console.log("✅ Cleared existing templates.");

    await Template.insertMany(templates);
    console.log("✅ Successfully seeded 8 templates.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
