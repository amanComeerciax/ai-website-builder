# THE PAGE BLUEPRINTS

### Exact Section Order, Content Rules, and Architecture for Every SaaS Page

> Paste this alongside the Design Rulebook before asking AI to build any page. Together they solve two separate problems: the Rulebook handles _how things look_, this document handles _what goes on the page and in what order_.

---

## HOW TO USE THIS DOCUMENT

This is not a design guide. It's an architecture guide. Each blueprint defines:

- **Which sections go on the page** — no guessing, no improvising
- **The order they appear** — order follows the buyer's journey, not your feature list
- **Each section's ONE job** — if a section is trying to do two things, it does neither well
- **What content belongs in it** — specific, not general
- **What must NOT be in it** — the anti-patterns that kill conversions
- **Mobile rules** — what changes at small screen sizes

Paste into any AI tool and say:

> _"Follow the Page Blueprint I've provided. Now build me [PAGE TYPE]."_

---

## QUICK REFERENCE TABLE

| Page Type           | Sections   | Primary Goal                                         |
| ------------------- | ---------- | ---------------------------------------------------- |
| SaaS Landing        | 11         | Convert visitor to trial/signup                      |
| Marketing (Feature) | 8          | Convert curious visitor to product user              |
| Pricing             | 7          | Remove friction from purchase decision               |
| Dashboard           | 6 zones    | Surface most important data fastest                  |
| Settings            | 5 groups   | Let users find and change settings without confusion |
| Onboarding          | 5 steps    | Get user to first value as fast as possible          |
| Empty State         | 3 elements | Convert zero-data screen into activation moment      |

---

---

# BLUEPRINT 1: SAAS LANDING PAGE

**Primary goal:** Convert a cold visitor into a trial signup or lead.  
**Visitor's mental state:** Skeptical. They've seen 50 landing pages this week.  
**Your job:** Prove value before they bounce (avg. time on page: 54 seconds).

---

## SECTION ORDER (NON-NEGOTIABLE)

```
1.  NAV
2.  HERO
3.  LOGO BAR
4.  PROBLEM
5.  SOLUTION
6.  FEATURES
7.  HOW IT WORKS
8.  SOCIAL PROOF
9.  PRICING
10. FINAL CTA
11. FOOTER
```

---

### SECTION 1 — NAV

**One job:** Let visitors orient themselves and access the primary CTA instantly.

**What goes in it:**

- Logo (left-aligned, always)
- 3–4 nav links max (Features, Pricing, About, Blog — pick the ones most visited)
- 1 CTA button (right-aligned, high contrast — "Start Free Trial" or "Get Started")
- Optional: secondary ghost link ("Sign In") beside the CTA

**What must NOT be in it:**

- More than 4 nav links (each link is a distraction from the CTA)
- Two equally-weighted CTAs ("Sign In" and "Get Started" at same visual weight)
- Dropdowns on the primary nav items
- Phone number, social icons, or tagline
- Sticky nav on scroll with different content than the original

**Mobile rules:**

- Hamburger menu at ≤768px
- CTA button stays visible in collapsed header — do NOT hide it in the menu
- Logo + hamburger + CTA all in one row

**Premium insight:** The nav CTA and the Hero CTA should be identical in label and destination. Consistency builds confidence. If nav says "Start Free" and hero says "Get Started," fix it.

---

### SECTION 2 — HERO

**One job:** Make the visitor understand what you do, who it's for, and why it matters — in 5 seconds.

**5-second test:** Cover the hero and ask someone what the product does. If they can't tell you, the hero is failing.

**What goes in it:**

- **Headline** (ONE line, 6–10 words): State the outcome, not the feature. "Close More Deals Without Changing Your Stack" not "The AI-Powered CRM Platform."
- **Subheadline** (1–2 lines): Who is it for + how it delivers the headline outcome. "Nexus connects your email, calendar, and CRM so your sales team spends time selling, not switching tabs."
- **Primary CTA button**: Action-oriented. "Start Free Trial" or "See It In Action" — not "Learn More."
- **Secondary CTA** (optional): Lower commitment. "Watch Demo" as a ghost/text link, never equal weight to primary.
- **Hero visual**: Product screenshot, product video (autoplaying, muted, looped), or illustrated mockup. Must show the actual product doing something real — not an abstract illustration.
- **Trust micro-line** (optional, high value): "No credit card required." or "Join 12,000+ teams already using Nexus." Placed directly below the CTA buttons.

**What must NOT be in it:**

- Two competing primary CTAs at equal visual weight
- A headline longer than 12 words
- Abstract hero art (gradients, 3D shapes, blobs) with no product visible
- Feature list in the hero — that belongs in FEATURES
- Video that doesn't autoplay (people won't click play; just autoplay muted)
- Countdown timers or "limited offer" banners — this is a first impression, not a sale
- The company's full mission statement

**Headline formula options:**

- [Do outcome] without [pain] — "Launch Faster Without Breaking Things"
- [Outcome] for [audience] — "Revenue Intelligence for Scaling Startups"
- [Verb] [outcome] in [timeframe] — "Cut Support Tickets in Half in 30 Days"
- The [category] that [differentiation] — "The CRM That Actually Updates Itself"

**Mobile rules:**

- Headline max 2 lines on mobile
- Hero visual stacks BELOW text (never side-by-side on mobile)
- Both CTA buttons stack vertically, full width
- Trust micro-line stays visible

**Premium insight:** The hero visual is your most important design decision on the page. A product screenshot showing real UI with real value always outperforms an illustration. Dashboard screenshots work best in dark mode, shown at slight angle (3–5°), with subtle drop shadow. Don't show an empty dashboard.

---

### SECTION 3 — LOGO BAR

**One job:** Establish trust through social proof before the visitor reads another word.

**What goes in it:**

- Label: "Trusted by teams at" OR leave labelless
- 5–8 company logos (grayscale — never colored logos, they fight each other)
- No descriptions, no quotes, no names — just logos

**What must NOT be in it:**

- Colored logos
- Logo descriptions ("As seen in Forbes" style — this belongs elsewhere)
- More than 8 logos (visual noise)
- Fake or obscure logos nobody recognizes (better to have 3 real ones than 8 no one knows)
- Stars, ratings, or review counts (that's SOCIAL PROOF section's job)

**Mobile rules:**

- Logos scroll horizontally (marquee/carousel) on mobile
- Never wrap logos into a grid on mobile — it looks like a footer

**Premium insight:** If you're early and have no recognizable logos, skip this section entirely — a logo bar with unknown companies damages trust instead of building it. Better to use a single strong testimonial quote in its place.

---

### SECTION 4 — PROBLEM

**One job:** Make the visitor feel seen. Show you understand their pain before offering a solution.

**Why this section exists:** Most landing pages skip straight from logo bar to features. This is a mistake. People don't buy features — they buy relief from pain. This section earns the right to pitch.

**What goes in it:**

- Section headline: Names the pain directly. "Running a sales team shouldn't feel like this." or "Why is everyone still doing this manually?"
- Pain points: 3 specific problems (not generic). Each pain point is 1 line. Written from the customer's perspective, in their language.
- Optional: statistics quantifying the pain (e.g., "Sales reps spend 65% of their week on non-selling activities.")
- Optional: visual showing the "before" state — messy spreadsheet, cluttered inbox, error message

**What must NOT be in it:**

- Your product. Not yet.
- Feature descriptions
- Solutions. This section is entirely about the problem — no hints at the fix
- Generic pain ("save time, save money") — must be specific to your category

**Pain point format:**

```
❌  Switching between 8 tools just to prep for one call
❌  Your CRM data is always out of date because nobody logs manually
❌  New reps take 3 months to ramp because there's no playbook
```

**Mobile rules:**

- Pain points stack vertically
- No 3-column layout on mobile for pain points

---

### SECTION 5 — SOLUTION

**One job:** Introduce your product as the direct answer to the problems just named.

**What goes in it:**

- Transition framing: "There's a better way." / "Meet [Product]." / "[Product] fixes all of this."
- Product name + one-sentence explanation of what it is
- 3 core capabilities (not features — capabilities): what the product _enables_ the user to do
- Optional: a short product video (60–90 sec explainer, not a sales video — a how-it-works video)

**What must NOT be in it:**

- More than 3 capabilities (more than 3 here confuses; details go in FEATURES)
- Technical architecture explanation
- Pricing
- Testimonials

**Capability format:**

```
[Icon]  Automatic Data Capture
        Your CRM updates itself from email, calendar, and calls. No manual entry.

[Icon]  Deal Intelligence
        See which deals are at risk and why, before they slip.

[Icon]  Rep Coaching at Scale
        Every call is analyzed. Every rep gets specific feedback. Every week.
```

---

### SECTION 6 — FEATURES

**One job:** Give technically-minded visitors the details they need to evaluate.

**What goes in it:**

- Section headline: "Everything you need to [outcome]"
- 4–8 features (6 is optimal)
- Each feature: icon + title (3–5 words) + description (2 lines max, 20 words max)
- Optional: product screenshot showing the feature (alternating left/right layout)
- Optional: feature highlight (one feature gets a larger treatment — your "hero feature")

**What must NOT be in it:**

- Paragraphs. Two lines per feature, max.
- More than 8 features. If you have 20 features, pick the 6 that solve the most pain.
- Technical jargon your customer doesn't use
- Nested bullet points inside feature descriptions

**Feature card format:**

```
[Icon]
Feature Name
Short description that focuses on outcome, not mechanism.
What does the user get? Not how does it work.
```

**Layout options:**

- 3-column grid (most common, works for 6 features)
- Alternating left/right with screenshot (works for 4–5 features, more visual impact)
- Tabbed features (works for products with distinct modules)

**Mobile rules:**

- 3-column grid → 1-column stack
- Alternating layout: image always above text, never beside it

**Premium insight:** Your feature list is not a changelog. Every feature description must answer "so what?" — what does the user actually gain? "Real-time sync" is a feature. "Your team sees changes instantly — no more version conflicts" is a benefit.

---

### SECTION 7 — HOW IT WORKS

**One job:** Show the journey from sign-up to value in 3–4 steps. Reduce perceived setup friction.

**Why this section exists:** Visitors who understand how they'll get value are 2x more likely to sign up. This section removes the "but how does it actually work?" objection.

**What goes in it:**

- Section headline: "Up and running in minutes" / "How [Product] Works" / "From signup to results in 4 steps"
- 3–4 numbered steps (not 5+)
- Each step: number + title + 1-line description
- Optional: small illustration or screenshot per step
- Optional: time estimate ("Takes 5 minutes" / "Most teams are live by end of day")

**What must NOT be in it:**

- More than 4 steps. If your onboarding takes 12 steps, show the 4 major milestones.
- Technical setup details (API keys, webhook config) — this is marketing, not docs
- A step that says "Contact sales" or "Schedule demo" — that kills momentum

**Step format:**

```
1  Connect your tools
   Link your email, calendar, and CRM in one click.
   Works with Gmail, Outlook, Salesforce, HubSpot.

2  It learns your process
   Reads your past deals to understand your sales motion.
   Setup takes under 10 minutes.

3  Your team gets to work
   Reps see their pipeline updated and prioritized every morning.
   Managers see risk signals in real time.

4  Close more, faster
   Average team sees results in week one.
```

---

### SECTION 8 — SOCIAL PROOF

**One job:** Prove with evidence — not your words — that real people got real results.

**What goes in it:**

- Section headline: "What teams say about [Product]" / "Trusted by [X] teams" — keep it plain
- 3 testimonials (3 is the proven sweet spot — more dilutes impact)
- Each testimonial: quote (specific outcome) + full name + title + company + photo
- Optional: customer logos grid (if you have 20+ logos, this is where they go)
- Optional: stat bar ("$2M in pipeline recovered" / "4.9/5 on G2" / "Used by 50,000 teams")

**What must NOT be in it:**

- Generic quotes ("Great product! Highly recommend." — useless)
- Anonymous testimonials ("Marketing Manager, Fortune 500")
- Stock photos as avatars — people can tell
- More than 5 testimonials in a single scrollable block
- Your own descriptions of customer success — let customers speak

**Testimonial quality standard:**

```
❌  WEAK: "Nexus is amazing. It really changed how we work."

✅  STRONG: "We recovered $340K in at-risk pipeline in the first month.
    I don't know how we managed without it."
    — Sarah Chen, VP Sales, Acme Corp
```

**The testimonial must name a specific outcome, timeframe, or before/after comparison.** If it doesn't, it's not a good testimonial — coach your customers to write them this way.

**Premium insight:** Video testimonials convert significantly better than text. If you can get even one 30-second video from a happy customer, put it here. Phone camera, natural lighting, authentic beats polished every time.

---

### SECTION 9 — PRICING

**One job:** Remove the uncertainty about cost that prevents sign-up decisions.

**What goes in it:**

- Section headline: "Simple, transparent pricing" — not just "Pricing"
- 3 tiers (3 tiers convert best; 4+ causes decision paralysis)
- Each tier: name + price + 1-line description of who it's for + 4–6 features (use checkmarks) + CTA button
- Recommended tier: visually highlighted (border, badge "Most Popular", slightly elevated)
- Annual/monthly toggle (if applicable — annual saves 20% is the standard)
- Trust line directly below pricing table: "No credit card required. Cancel anytime."
- FAQ (3–4 items addressing pricing objections): "Can I switch plans?", "What counts as a user?", "Do you offer refunds?"

**What must NOT be in it:**

- "Contact sales" as the only option for a tier — show a price or a price range
- More than 8 features listed per tier — use the comparison table for deep dives
- Crossed-out "original" prices unless there's a real promotion
- Hiding per-user pricing in the footnotes

**Tier naming conventions (pick a pattern and stick to it):**

- Size-based: Starter / Growth / Enterprise
- Outcome-based: Launch / Scale / Dominate
- Persona-based: Solo / Team / Company
- Avoid: Basic / Pro / Premium (too generic, every SaaS uses this)

**Pricing CTA by tier:**

- Lowest tier: "Start Free" or "Try Starter Free"
- Middle tier: "Start Free Trial" (this is the one you want them to pick)
- Highest tier: "Contact Sales" or "Talk to Us" is acceptable here only

**Mobile rules:**

- Stack pricing tiers vertically on mobile
- Highlighted/recommended tier appears first (top) on mobile
- Comparison table becomes scrollable or collapses to accordion on mobile

**Premium insight:** Show annual pricing as the default with monthly as the toggle — not the reverse. This anchors visitors to the lower annual price first. The dollar savings framing ("Save $200/year") converts better than percentage framing ("Save 20%").

---

### SECTION 10 — FINAL CTA

**One job:** Catch the visitors who scrolled to the bottom but haven't signed up yet.

**What goes in it:**

- High-contrast background (dark section — opposite of surrounding content)
- ONE headline (restate the core value proposition, not a new pitch)
- ONE CTA button (same as hero — identical label and destination)
- ONE supporting line below button ("No credit card required." / "Join 12,000+ teams.")
- That's it. Nothing else.

**What must NOT be in it:**

- Two CTA buttons
- A new value proposition not mentioned before — this is reinforcement, not introduction
- Feature list or bullet points
- Pricing information
- Form fields (this is a button section, not a lead gen form)

**Premium insight:** The final CTA section is the single highest-converting section after the hero — because visitors who reach it are already interested, they just need one more push. Treat it as seriously as the hero.

---

### SECTION 11 — FOOTER

**One job:** Provide navigation and legal links for visitors who need them.

**What goes in it:**

- Logo (top left)
- 3–4 column link groups: Product (Features, Pricing, Changelog), Company (About, Blog, Careers), Support (Docs, Status, Contact), Legal (Privacy, Terms)
- Social icons (small, bottom row)
- Copyright line
- Optional: newsletter signup (one field, one button — "Get product updates")

**What must NOT be in it:**

- A CTA button competing with the main page CTA (footer CTAs cannibalize conversions)
- Testimonials
- Product screenshots
- Pricing

---

---

# BLUEPRINT 2: FEATURE / PRODUCT PAGE

**Primary goal:** Convert a visitor who's already product-aware into a trial user of a specific feature.  
**Visitor's mental state:** Product-aware. They found this page from a landing page, an ad, or search. They want depth.

---

## SECTION ORDER

```
1. HERO (feature-specific)
2. PROBLEM THIS FEATURE SOLVES
3. CAPABILITIES
4. HOW IT WORKS
5. INTERACTIVE DEMO OR DEEP-DIVE VIDEO
6. INTEGRATIONS
7. TESTIMONIALS (feature-specific)
8. CTA
```

---

### SECTION 1 — HERO (feature-specific)

**One job:** Immediately establish what this feature does and who it helps.

**What goes in it:**

- Feature name as the headline (not "Introducing [Feature]" — just name it clearly)
- Subheadline: what the feature enables in 1–2 sentences
- CTA: "Try [Feature]" or "Start Free Trial"
- Product screenshot showing only this feature (not the full dashboard)
- Breadcrumb or "back to features" link (optional but good for UX)

**What must NOT be in it:**

- Overview of the entire product — this page is about one feature
- Pricing

---

### SECTION 2 — PROBLEM THIS FEATURE SOLVES

**One job:** Confirm the visitor is in the right place by naming the exact problem they came to solve.

**What goes in it:**

- 2–3 specific pain points this feature addresses
- Make it targeted: "If you're a sales manager with a team of 10+, this is for you."

---

### SECTION 3 — CAPABILITIES

**One job:** Show the 3–5 main things this feature can do.

**What goes in it:**

- 3–5 capability cards (capabilities = things the user will actually do, not abstract benefits)
- Each: icon + title + 2-line description + optional mini-screenshot

---

### SECTION 4 — HOW IT WORKS

**One job:** Show the exact workflow — how does a user get from zero to using this feature?

**What goes in it:**

- 3–4 steps, numbered
- Each step shows a specific action + what the product does in response

---

### SECTION 5 — INTERACTIVE DEMO OR DEEP-DIVE VIDEO

**One job:** Let the visitor experience the feature without signing up.

**Options (pick one):**

- **Embedded interactive demo** (Arcade, Navattic, Storylane) — best for complex features
- **Product video** (2–4 minutes, screen recording of real usage) — best for workflow features
- **Annotated screenshots carousel** — minimum viable option if no video/demo available

**What must NOT be in it:**

- A 10-minute full product tour — keep it focused on this feature only
- Sales-style video ("Schedule a call today!") — this should be educational, not a pitch

---

### SECTION 6 — INTEGRATIONS

**One job:** Remove the "but does it work with my stack?" objection.

**What goes in it:**

- Logo grid of integrations relevant to this feature
- Brief line: "Works with the tools you already use."
- If many integrations: show top 6, link to full integrations page

---

### SECTION 7 — TESTIMONIALS (feature-specific)

**One job:** Provide evidence from people who used specifically this feature.

**What goes in it:**

- 2–3 testimonials that reference this feature specifically
- Same quality standard: specific outcome + real person + real role

---

### SECTION 8 — CTA

**One job:** Convert the now-informed visitor.

**What goes in it:**

- Headline restating the feature's primary outcome
- Primary CTA + trust line
- Optional: secondary CTA to see the full feature list or pricing

---

---

# BLUEPRINT 3: PRICING PAGE

**Primary goal:** Remove every objection standing between a motivated visitor and a purchase.  
**Visitor's mental state:** Actively evaluating. They know your product — now they're deciding if it's worth the price.

---

## SECTION ORDER

```
1. HERO (value framing, not just "Pricing")
2. PRICING TIERS
3. FEATURE COMPARISON TABLE
4. SOCIAL PROOF (logos + stats)
5. FAQ
6. FINAL CTA
```

---

### SECTION 1 — HERO (pricing page)

**One job:** Frame the price in terms of value before showing a number.

**What goes in it:**

- Headline: "Pricing that grows with you" / "Invest in [outcome], not software" — something that reframes price as value
- 1-line subheadline
- Annual/monthly toggle (show annual by default)

**What must NOT be in it:**

- The word "Affordable" (every SaaS says this)
- Feature overview (wrong page for that)
- Actual pricing numbers here — that's next section

---

### SECTION 2 — PRICING TIERS

Same structure as PRICING section in Landing Page blueprint.

**Additional pricing page rule:** You have more space here — add a proper feature comparison table below the tier cards. On the landing page you skip it. On the pricing page it earns its place.

---

### SECTION 3 — FEATURE COMPARISON TABLE

**One job:** Let detail-oriented buyers compare every feature across tiers without asking sales.

**What goes in it:**

- All features grouped by category
- Checkmarks (✓) for included, dashes (—) for excluded, values for limits ("5 users" / "Unlimited")
- Sticky header showing tier names as user scrolls
- Highlight the recommended tier column

**What must NOT be in it:**

- Marketing language in table cells — only facts, checkmarks, and numbers
- More than 6 feature categories (beyond that, use accordion/expand)

**Mobile rules:**

- Table becomes horizontally scrollable
- Pin the feature name column (left) while tiers scroll right

---

### SECTION 4 — SOCIAL PROOF

**One job:** Validate the price with evidence from real customers.

**What goes in it:**

- Review badges (G2, Capterra, Product Hunt) with scores — include the rating number, not just logos
- 2–3 testimonials specifically about value and ROI: "We made back the annual fee in the first week"
- Optional stat bar: "$4.2M in revenue attributed" / "4.9/5 avg rating" / "99.9% uptime SLA"

---

### SECTION 5 — FAQ

**One job:** Kill the last objections before the visitor makes a decision.

**Standard pricing FAQ — answer all of these:**

1. Can I change plans at any time?
2. What happens if I exceed my plan limits?
3. Do you offer refunds or a free trial?
4. How does [per-seat / per-usage] pricing work?
5. Is there a free plan or free tier?
6. Do you offer discounts for nonprofits / startups / annual?
7. What payment methods do you accept?

**Format:** Accordion (collapsed by default). 7 questions max.

---

### SECTION 6 — FINAL CTA

Same as landing page FINAL CTA. One headline. One button. One trust line.

---

---

# BLUEPRINT 4: DASHBOARD

**Primary goal:** Surface the most important data in the fewest possible interactions.  
**User's mental state:** Time-pressured. They opened the dashboard to get a specific answer or take a specific action — not to explore.

---

## LAYOUT STRUCTURE

```
┌─────────────────────────────────────────────────────┐
│  GLOBAL HEADER (logo, nav, user, notifications)     │
├──────────┬──────────────────────────────────────────┤
│          │  PAGE HEADER (title, filters, actions)   │
│  SIDE    ├──────────────────────────────────────────┤
│  NAV     │  METRIC STRIP (top KPIs — 3–4 max)       │
│          ├──────────────────────────────────────────┤
│          │  PRIMARY CONTENT ZONE                    │
│          │  (main chart / table / list)             │
│          ├──────────────────────────────────────────┤
│          │  SECONDARY CONTENT ZONE                  │
│          │  (supporting charts / modules)           │
│          ├──────────────────────────────────────────┤
│          │  TERTIARY / DETAIL ZONE                  │
│          │  (granular data, recent activity)        │
└──────────┴──────────────────────────────────────────┘
```

---

### ZONE 1 — GLOBAL HEADER

**One job:** Global navigation and user context.

**What goes in it:**

- Logo / product wordmark
- Global search (if search is a core action)
- Notification bell with unread count
- User avatar with dropdown (profile, settings, logout)
- Optional: environment switcher (Staging / Production) for dev tools

**What must NOT be in it:**

- Page-level filters (those belong in PAGE HEADER)
- Content or data
- CTAs (unless it's a critical upgrade prompt for free tier users)

---

### ZONE 2 — SIDE NAV

**One job:** Let users navigate between major sections of the product.

**What goes in it:**

- Section icons + labels (always show labels — icon-only navs fail usability tests)
- Active state clearly visible (left border accent + background highlight)
- 5–7 items max in primary nav (more → group into sections)
- Secondary group at bottom: Settings, Help, Feedback, Upgrade

**Ordering rule:** Most-used sections at top. Settings/help at bottom. Never alphabetical.

**What must NOT be in it:**

- More than 2 nav levels (parent + children is fine; grandchildren is too deep)
- Upgrade CTAs in the main nav flow (put at bottom of sidebar, muted)

**Mobile rules:**

- Side nav collapses to bottom tab bar (5 tabs max) on mobile
- OR collapses to hamburger that slides in from left
- Bottom tab bar: icons + labels, active state fills icon

---

### ZONE 3 — PAGE HEADER

**One job:** Orient the user and give them page-level controls.

**What goes in it:**

- Page title (left-aligned, always)
- Date range picker or filter controls (if the page's data is time-bound)
- Primary page action button (right-aligned): "Create New", "Export", "Invite"
- Breadcrumb (for nested pages)

**What must NOT be in it:**

- Multiple primary actions at equal weight (pick the one most important action per page)
- Help text or onboarding tips

---

### ZONE 4 — METRIC STRIP

**One job:** Show the 3–4 most important numbers for this page at a glance.

**What goes in it:**

- 3–4 KPI cards (never more — if you have 8 KPIs, pick the 4 most actionable)
- Each card: metric name + value + trend (arrow + percentage vs. prior period)
- Trend color: green = positive, red = negative (and product must know which direction is "good" per metric)
- Click-through to detailed view

**What must NOT be in it:**

- More than 4 cards — beyond 4, the strip becomes noise and nothing stands out
- Metrics without context ("42" means nothing; "42 active users ↑ 12% this week" means something)

**F-pattern rule:** The leftmost metric card gets the most visual attention. Put your most important metric there.

---

### ZONE 5 — PRIMARY CONTENT ZONE

**One job:** Display the single most important piece of information for this dashboard page.

**Rules:**

- One primary visualization only — one chart, one table, or one list (not all three)
- Full width or 2/3 width
- Title + description above the chart (what is this showing and why does it matter?)
- Export action on this zone

**Chart type selection rules:**

- Time trends → Line chart
- Comparisons between categories → Bar chart (horizontal for long labels)
- Part-of-whole (max 5 segments) → Donut chart (not pie)
- Relationships/correlation → Scatter plot
- Never: 3D charts, shadow effects on charts, excessive gridlines (10% opacity max)

---

### ZONE 6 — SECONDARY + TERTIARY ZONES

**One job:** Provide supporting context for the primary zone.

**Rules:**

- 2-column grid for secondary zone (two modules side by side)
- Single column for tertiary (recent activity feed, logs, detail tables)
- Each module: own title + optional time filter + optional expand/drill-down
- Modules should be visually bounded (card with subtle border or background separation)

**What must NOT be in it:**

- Redundant data already shown in the metric strip
- Onboarding prompts (unless user has no data yet → see EMPTY STATE blueprint)

**Mobile rules:**

- All zones stack vertically
- Metric strip scrolls horizontally (don't shrink the cards)
- Complex charts get a "View full chart" link that opens a full-screen modal on mobile
- Never show a data table in mobile default view — link to it

---

---

# BLUEPRINT 5: SETTINGS PAGE

**Primary goal:** Let users find any setting in under 10 seconds and change it without confusion.  
**User's mental state:** Task-focused. They came here to change one specific thing. They're not browsing.

---

## LAYOUT STRUCTURE

```
┌──────────┬──────────────────────────────────────────┐
│          │  PAGE TITLE: "Settings"                  │
│  SIDE    ├──────────────────────────────────────────┤
│  NAV     │  SECTION TITLE (e.g., "Account")         │
│  (left)  │  Settings Group 1                        │
│          │  Settings Group 2                        │
│          ├──────────────────────────────────────────┤
│          │  SECTION TITLE (e.g., "Security")        │
│          │  Settings Group 3                        │
└──────────┴──────────────────────────────────────────┘
```

---

### SETTINGS NAVIGATION (Left Sidebar)

**Groups (standard SaaS order):**

1. **Account** — name, email, avatar, language, timezone
2. **Security** — password, 2FA, sessions, connected devices
3. **Notifications** — email, in-app, mobile push preferences
4. **Team / Members** — invite, roles, permissions (if multi-user product)
5. **Billing** — plan, payment method, invoices
6. **Integrations** — third-party connections, API keys, webhooks
7. **Danger Zone** — delete account, export data (always last, always visually separated)

**Rules:**

- Show all group names in sidebar even when collapsed — never hide navigation
- Active group highlighted (same treatment as dashboard side nav)
- "Danger Zone" section has red/warning visual treatment to signal irreversibility

---

### SETTINGS CONTENT AREA — GENERAL RULES

**Layout:**

- Max width: 720px (settings forms should never be full-width — they become hard to scan)
- Each setting: label (left) + control (right) for horizontal desktop layout
- OR label above + control below for mobile

**Setting types and their controls:**
| Setting type | Control |
|---|---|
| Toggle on/off | Toggle switch — NOT a checkbox |
| One choice from few options | Radio buttons (all visible at once) |
| One choice from many options | Dropdown select |
| Multiple choices | Checkbox group |
| Text input | Input field with placeholder + character count if limited |
| Date/time | Date picker — NOT a raw text field |
| Dangerous action | Separate section, red warning, requires typing to confirm |

**Save behavior — pick ONE and be consistent across the entire settings page:**

- **Auto-save** (preferred for toggles): Change takes effect immediately, show "Saved" toast
- **Save button per section**: Show save button below each section
- **Global save button**: Only if the entire settings page is a single form

**Never mix auto-save and save buttons on the same page.** Users won't know which changes have been saved.

---

### DANGER ZONE SECTION

**Rules (non-negotiable):**

- Always the last section in settings
- Red/warning background or border to visually separate from other settings
- Destructive actions require a confirmation step
- Confirmation must require typing the resource name or "DELETE" — not just clicking OK
- Show consequences clearly: "This will permanently delete your account and all data. This cannot be undone."
- Never show multiple danger actions in the same row — each deserves individual prominence

---

### SETTINGS MOBILE RULES

- Side nav collapses to a dropdown select or accordion at top of page
- Full-width layout for all form controls
- Toggle switches minimum 44×44px tap target
- Destructive actions require an extra confirmation tap on mobile

---

---

# BLUEPRINT 6: ONBOARDING FLOW

**Primary goal:** Get the user to their "first value moment" as fast as possible.  
**User's mental state:** Motivated but impatient. They signed up — now they want to see if it's worth their time before they lose interest.

**The rule:** Every step that doesn't directly lead to the first value moment should be cut.

---

## STEP ORDER

```
1. WELCOME + EXPECTATION SETTING
2. ESSENTIAL SETUP (only what's required for first value)
3. FIRST VALUE MOMENT
4. INVITE / CONNECT (optional — only after first value)
5. DASHBOARD ENTRY WITH PROGRESS INDICATOR
```

---

### STEP 1 — WELCOME + EXPECTATION SETTING

**One job:** Tell the user exactly what's going to happen in the next few minutes.

**What goes in it:**

- Welcome message (personalized: "Welcome, [Name]")
- Progress indicator showing total steps ("Step 1 of 3")
- Time estimate: "Takes about 4 minutes"
- What they'll be able to do when finished

**What must NOT be in it:**

- Company values, mission statement, or marketing copy
- Optional fields
- Product tour (comes after first value, not before)

---

### STEP 2 — ESSENTIAL SETUP

**One job:** Collect only the minimum information needed to deliver first value.

**Rules:**

- Each screen: ONE question or ONE action
- No more than 3 setup screens total before first value
- Every field is mandatory and necessary — if it's optional, remove it from onboarding
- "Skip for now" is acceptable only for steps that are truly optional (integrations, invites)
- Show progress bar throughout

**What must NOT be here:**

- Billing details (unless paid-only product)
- Inviting team members (post-value step)
- Avatar upload, notification preferences, theme selection

---

### STEP 3 — FIRST VALUE MOMENT

**One job:** Deliver the core value of the product before asking for anything else.

**What this looks like by product type:**

- Analytics → Show a populated dashboard with their data
- CRM → Show contacts imported and organized
- Project management → Create first project, show it ready to use
- Email tool → Send a test email, show it worked

**Rules:**

- Must show real output, not empty state
- If you need sample/demo data to make this work, use it and label it as demo data
- This is the moment they decide to stay or leave — make it visually impressive

---

### STEP 4 — INVITE / CONNECT (optional)

**Only show this if:**

- The product is genuinely more valuable with teammates
- The user has already experienced first value

**What goes in it:**

- "Invite your team" — email fields, max 3 fields, send invites immediately
- OR "Connect [key integration]" — one integration most users need

---

### STEP 5 — DASHBOARD ENTRY WITH PROGRESS

**One job:** Send the user into the product with a clear sense of what to do next.

**What goes in it:**

- Onboarding checklist embedded in the dashboard (collapsed, not full-page)
- Completed steps shown as checked; next recommended action highlighted
- Dismiss option after 70%+ completion

**What must NOT be in it:**

- Full-page onboarding overlay that blocks the product
- More than 5 checklist items (each must be completable in under 2 minutes)

---

---

# BLUEPRINT 7: EMPTY STATE

**Primary goal:** Turn a "nothing here yet" moment into an activation moment.  
**Applies to:** New dashboard with no data, empty project list, empty inbox, zero search results.

**The rule:** An empty state is not a failure state. It's an opportunity to guide the user to their first action.

---

## STRUCTURE (always 3 elements)

```
1. ILLUSTRATION OR ICON
2. EXPLANATION
3. PRIMARY ACTION
```

---

### ELEMENT 1 — ILLUSTRATION OR ICON

**One job:** Make the empty state feel intentional, not broken.

**Rules:**

- Use a contextual illustration showing what the space will look like when filled
- OR a simple, large icon from your design system
- Match the content type: empty inbox → envelope icon, empty project → folder icon
- Never a generic "no data" icon
- Warm and inviting, not clinical

---

### ELEMENT 2 — EXPLANATION

**One job:** Tell the user why it's empty and what they can do about it.

**Format:**

- Headline: "[Resource] name" — "Your projects live here" / "No contacts yet"
- Subline: 1–2 sentences explaining how to populate this space
- Sound helpful, not apologetic

**What must NOT be in it:**

- Error language: "Nothing found", "No results", "No data available"
- Technical reason why it's empty
- More than 2 lines of text

---

### ELEMENT 3 — PRIMARY ACTION

**One job:** Give the user one clear thing to do right now.

**Rules:**

- ONE button. Not two. Not a link and a button.
- Button label names the action: "Create your first project" / "Import contacts" / "Connect Gmail"
- Optional: secondary help link below: "Learn how projects work →"

**Zero-result search rules:**

- Show what was searched: "No results for 'expense reports'"
- Suggest alternatives: "Try different keywords" or "Check spelling"
- Offer escape: "Browse all [category]" button
- Never a blank white screen

---

---

# ANTI-PATTERNS INDEX

Common page architecture mistakes. Add to any AI prompt: _"Do not commit these anti-patterns."_

## Landing Page Anti-Patterns

| Anti-Pattern                                         | Why It Fails                                                       | Fix                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| Hero headline describes the product, not the outcome | People buy outcomes, not products                                  | Rewrite headline to state the result the user gets |
| Logo bar with unrecognizable logos                   | Damages trust instead of building it                               | Remove or replace with a single strong quote       |
| Features section before problem section              | User doesn't care about features if they don't feel the pain first | Reorder: Problem → Solution → Features             |
| Pricing hidden or absent                             | Users abandon when they can't find pricing                         | Add pricing section or at least a pricing range    |
| 4+ pricing tiers                                     | Decision paralysis                                                 | Max 3 tiers                                        |
| Testimonials without specifics                       | "Great product!" is useless social proof                           | Require: outcome + metric + role + name            |
| Final CTA section with multiple buttons              | Diffuses attention                                                 | One button only                                    |
| Nav with 6+ links                                    | Every extra link is a decision point                               | Max 4 links + 1 CTA                                |
| Two primary CTAs at equal visual weight in hero      | Creates confusion                                                  | One primary CTA, one ghost/text secondary          |
| Abstract illustration in hero (no product visible)   | Visitor can't tell what the product actually does                  | Show real product UI                               |

## Dashboard Anti-Patterns

| Anti-Pattern                              | Why It Fails                      | Fix                                             |
| ----------------------------------------- | --------------------------------- | ----------------------------------------------- |
| 8+ metric cards in the strip              | Nothing stands out                | Max 4 cards                                     |
| Icon-only sidebar navigation              | Users don't recognize icons alone | Always show labels                              |
| Filters in global header AND page header  | Confusing scope — which applies?  | Pick one location                               |
| 3D charts                                 | Distorts values, harder to read   | Flat charts only                                |
| Complex data table as default mobile view | Unusable on small screens         | Hide/link to table on mobile, show summary card |
| No empty state for new users              | Blank dashboard feels broken      | Design empty states for every widget            |
| Most important KPI not in leftmost card   | Users scan left-to-right          | F-pattern: leftmost card = most important       |

## Settings Anti-Patterns

| Anti-Pattern                                       | Why It Fails                                   | Fix                                                        |
| -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Mixing auto-save and save buttons                  | Users don't know what's saved                  | Pick one pattern, apply everywhere                         |
| Danger zone mixed with regular settings            | Risk of accidental destructive actions         | Always separate at bottom with visual warning              |
| Confirmation dialogs without consequence statement | "Are you sure?" is not enough                  | State exactly what will be deleted and that it's permanent |
| Full-width settings forms                          | Hard to scan                                   | Max 720px width                                            |
| Settings in a modal                                | Modals feel temporary; settings feel permanent | Use a dedicated settings page, not a modal                 |
| Checkboxes for on/off toggles                      | Checkboxes imply selection, not activation     | Use toggle switches for binary on/off                      |

---

---

# COMBINED USAGE PROMPT

Use this template to get the best results from any AI tool when building SaaS pages:

```
I'm building a [PAGE TYPE] for [PRODUCT NAME].

DESIGN RULES: Follow the Design Rulebook for all visual decisions
(typography, color, spacing, components).

PAGE ARCHITECTURE: Follow the Page Blueprints for structure
(section order, content in each section, what to exclude).

Page type: [landing page / pricing / dashboard / settings / feature page / onboarding]

Product: [one paragraph description]
Target user: [who they are, their role, their context]
Primary goal: [what you want the user to do on this page]
Key features to highlight: [list the 3 most important]
Tone: [e.g., professional, conversational, technical]

DO NOT commit any anti-patterns listed in the Page Blueprints document.
```

---

_Page Blueprints v1.0 — Companion document to Design Rulebook v1.9_  
_Covers: SaaS Landing Page, Feature Page, Pricing Page, Dashboard, Settings, Onboarding, Empty States_
