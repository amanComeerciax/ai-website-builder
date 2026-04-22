const mongoose = require('mongoose');
const Template = require('./models/Template');
require('dotenv').config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const updates = [
    { slug: "creative-agency-portfolio", cat: ["agency", "portfolio"] },
    { slug: "local-coffee-shop", cat: ["local-business", "ecommerce"] },
    { slug: "e-commerce-storefront", cat: ["ecommerce", "fashion"] },
    { slug: "developer-resume", cat: ["portfolio", "blog"] },
    { slug: "waitlist-capture", cat: ["landing", "saas"] },
    { slug: "saas-landing-page", cat: ["saas", "landing"] },
    { slug: "real-estate-listings", cat: ["real-estate", "local-business"] },
    { slug: "event-registration", cat: ["event", "landing"] },
    { slug: "build-log", cat: ["blog", "portfolio"] },
    { slug: "lifebydesign", cat: ["blog", "health"] },
    { slug: "tempate1", cat: ["landing", "portfolio"] },
    { slug: "template2", cat: ["landing", "agency"] },
    { slug: "template3", cat: ["saas", "landing"] },
    { slug: "template4", cat: ["ecommerce", "local-business"] },
    { slug: "template5", cat: ["service", "landing"] },
    { slug: "template6", cat: ["health", "fitness"] },
    { slug: "terroir", cat: ["travel", "blog"] },
    { slug: "modern-saas-hero", cat: ["saas", "landing"] },
    { slug: "montek", cat: ["saas", "agency"] },
    { slug: "vex", cat: ["portfolio", "event"] },
    { slug: "targo", cat: ["local-business", "service"] },
    { slug: "gaming-type", cat: ["event", "landing"] },
    { slug: "mindloop", cat: ["saas", "education"] },
    { slug: "archive", cat: ["portfolio", "blog"] },
    { slug: "potfolio-cosmic", cat: ["portfolio", "landing"] },
    { slug: "neon-ribbon", cat: ["event", "landing"] }
  ];

  for (const {slug, cat} of updates) {
    if (slug) {
        await Template.updateOne({ slug }, { $set: { categories: cat }});
    }
  }

  console.log("Categories updated!");
  process.exit(0);
}
run().catch(console.error);
