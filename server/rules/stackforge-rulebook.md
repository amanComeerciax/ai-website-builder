# STACKFORGE AI — MASTER GENERATION RULEBOOK
**Version 2.0 | Next.js Edition | LLM-Executable | Hallucination-Proof**

> This rulebook governs ALL website generation in StackForge AI.
> There are exactly TWO output tracks: HTML and Next.js. Nothing else.
> Every rule is a hard constraint. "Always" means always. "Never" means never.
> Do not explain what you are doing. Return only the requested output.
> Rules marked CRITICAL cause immediate job failure if violated.
> Rules marked MUST are enforced by the post-generation validator.

---

## SECTION 1 — PHASE INJECTION MAP

Each AI call receives ONLY the sections for its current phase.
Never inject the full rulebook — it causes Qwen to crash from context overflow.

| Phase | Model | Inject These Sections | Job |
|---|---|---|---|
| Phase 1 — Parse | Mistral | Section 2 only | Raw prompt → structured JSON |
| Phase 2 — Plan | Mistral | Sections 3 + 4 + 5 | Fonts, colors, page structure |
| Phase 3 — Track A generate | Qwen | Section 6 + Section 8 | Write one self-contained HTML file |
| Phase 3 — Track B generate | Qwen | Section 7 + Section 8 + Section 9 | Write one Next.js file at a time |
| Phase 4 — Validate | Validator | Section 8 all rules | Catch violations before preview |
| Phase 4 — Summarize | Mistral | None | Write summary + action chips |
| Iteration | Mistral + Qwen | Section 10 FIRST, then relevant | Classify scope, then generate |

### Hard Constraints (apply to every phase)
- You receive only the sections listed above for your current phase
- Do not apply rules from sections you have not been given
- Do not add features not asked for in the user prompt
- Do not explain what you are doing — return only the output
- If a task cannot be completed without breaking a rule, return `{"error": "RULE_VIOLATION", "detail": "..."}` — do not bend the rules

---

## SECTION 2 — PROMPT PARSING RULES

> **Phase 1 only. Mistral receives this section + the user's raw prompt.**

### 2.1 — Required Output Schema

Return ONLY this JSON. No markdown fences. No explanation. Nothing before or after the closing brace.

```json
{
  "siteType": "coffee shop landing page",
  "pageType": "landing",
  "outputTrack": "html",
  "sections": ["hero", "menu", "about", "testimonials", "contact"],
  "colorPreference": "dark",
  "targetAudience": "local customers",
  "fontMood": "warm and artisanal",
  "vaguePhrases": [
    { "phrase": "modern", "interpretation": "clean sans-serif, generous whitespace, monochromatic" }
  ],
  "assumptions": ["dark background inferred from colorPreference"],
  "clarificationNeeded": false,
  "clarificationQuestion": null
}
```

If `clarificationNeeded` is `true` — fill `clarificationQuestion` and stop immediately. Do not generate a plan.

---

### 2.2 — Output Track Classification (TWO TRACKS ONLY)

There are exactly two output tracks. No others exist. Set `outputTrack` based on prompt content.

| Set `outputTrack` to... | When the prompt contains... | Examples |
|---|---|---|
| `"html"` | Simple static sites, single-purpose websites, landing pages | portfolio, restaurant, coffee shop, bakery, barber, salon, agency, blog, event, wedding, gym, clinic |
| `"html"` | Explicit simplicity signals | "simple", "basic", "one-page", "landing page", "static", "just a website" |
| `"nextjs"` | App-like features requiring state, routing, or interactivity | dashboard, SaaS, e-commerce, admin panel, multi-page app, booking system |
| `"nextjs"` | Auth, user accounts, or real data | "login", "signup", "user profile", "database", "API", "members area" |
| `"nextjs"` | Complex UI patterns | real-time features, data tables, forms with validation, infinite scroll |

**Default rule:** When in doubt → `"html"`. HTML previews instantly. Next.js requires a build step.
**Never invent a third track.** The only valid values are `"html"` and `"nextjs"`.

---

### 2.3 — Vague Phrase Dictionary

When these phrases appear in the user prompt, apply the exact interpretations below. No guessing.

| User says | Exact interpretation | Apply to |
|---|---|---|
| "make it modern" | Clean sans-serif font, 8px scale spacing, subtle borders, monochromatic palette + one accent | `fontMood`, `colorPreference` |
| "make it pop" | Increase accent saturation, maximize bg/text contrast, reduce competing visual elements | `colorPreference` |
| "make it dark" | Background: `#0f0f0f`, Surface: `#1a1a1a`, Text: `#e8e8e8`, Accent stays same hue lightened | `colorPreference: "dark"` |
| "make it minimal" | Max 2 colors, doubled whitespace, no decorative elements, no shadows, no gradients | `colorPreference`, layout |
| "make it professional" | Dark navy/charcoal, serif heading font (Fraunces or Playfair Display), conservative grid | `fontMood`, `colorPreference` |
| "make it fun" | border-radius ≥ 16px everywhere, warm orange/yellow accent, playful font (Cabinet Grotesk or Syne) | `fontMood`, `colorPreference` |
| "make it clean" | Off-white background `#f8f8f6`, dark text, single accent, generous padding | `colorPreference` |
| "add animations" | Scroll reveals + hover states only. No auto-playing loops. No full-motion graphics. | `animationLevel: "subtle"` |
| "make it luxurious" | Dark background, gold `#c9a84c` accent, Cormorant Garamond heading, generous whitespace | `fontMood`, `colorPreference` |
| "make it bold" | Archivo Black or Bebas Neue display font, high contrast, large hero text, strong accent | `fontMood` |

---

### 2.4 — Clarification Rules

- Ask ONE clarifying question only when: prompt is a new site request AND under 8 words AND does not name the industry
- Never ask about: colors, fonts, sections — infer from defaults
- Never ask on: edit requests, iteration prompts, prompts over 8 words
- Valid question: `"What industry or purpose is this website for?"`

---

### 2.5 — Default Assumptions

| Property | Default | Override when |
|---|---|---|
| `colorPreference` | `"light"` | User says "dark", "black background", "night mode" |
| `outputTrack` | `"html"` | User mentions app-like features (see 2.2) |
| Images | `https://placehold.co/WxH` | User provides real image URLs |
| Fonts | Auto from approved list (see Section 3) | User names a specific font |
| Responsive | `true` — always mobile-first | **Never override** |
| Copyright year | `new Date().getFullYear()` via JS | **Never hardcode a year** |

---

## SECTION 3 — TYPOGRAPHY RULES

> **Phase 2 only. Mistral receives this section.**

### 3.1 — Font Pairing

> CRITICAL: Always exactly 2 fonts. Never 1. Never 3.
> CRITICAL: Never use Arial, Times New Roman, Comic Sans, Inter alone, Roboto alone.
> CRITICAL: Never use serif/display fonts inside app UI or dashboards — only on landing/marketing pages.
> CRITICAL: Next.js — always load via `next/font/google` in `app/layout.tsx`. Never `<link>` tags.

| `fontMood` value | Heading Font | Body Font | Character |
|---|---|---|---|
| `"warm and artisanal"` | Fraunces | DM Sans | Organic, handcrafted, cozy |
| `"professional"` | Playfair Display | Plus Jakarta Sans | Authoritative, trustworthy |
| `"bold and modern"` | Archivo Black | Outfit | Strong, impactful |
| `"minimal"` | DM Serif Display | Figtree | Clean, editorial |
| `"playful"` | Syne | Nunito | Energetic, friendly |
| `"luxury"` | Cormorant Garamond | Lato | Elegant, refined |
| `"editorial"` | Clash Display | Source Sans 3 | Magazine-like |
| `"tech / SaaS"` | Cabinet Grotesk | Manrope | Sophisticated, functional |

**Next.js font loading (app/layout.tsx):**
```tsx
import { DM_Sans, Fraunces } from 'next/font/google'

const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const heading = Fraunces({ subsets: ['latin'], variable: '--font-heading' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**HTML font loading (Track A only):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=HEADING_FONT&family=BODY_FONT&display=swap" rel="stylesheet">
```

---

### 3.2 — Type Scale (strict — no values outside this list)

| Level | Size | Usage | Weight |
|---|---|---|---|
| xs | 12px | Labels, captions, metadata | 500 |
| sm | 14px | Secondary text, timestamps | 400 |
| base | 16px | Body copy — **never smaller on mobile** | 400 |
| md | 20px | Lead text, subtitles | 400–500 |
| lg | 28px | Section headings (H3) | 600–700 |
| xl | 36px | Page subheadings (H2) | 700 |
| 2xl | 48px | Page titles (H1) desktop | 700–800 |
| 3xl | 64–80px | Hero headlines only | 800 |

Forbidden sizes: 13px, 17px, 22px, 25px, 30px, 38px, 42px — any value not in the table above.

| Property | Rule |
|---|---|
| Line height — body | 1.65–1.75 |
| Line height — headings | 1.1–1.25 |
| Letter spacing — headings | -0.02em to -0.04em |
| Letter spacing — hero text (64px+) | -0.03em to -0.05em |
| Letter spacing — all caps labels | 0.08em to 0.12em |
| Max text column width | 680px |
| Font weights | 400, 500, 700 only |

### 3.3 — Typography Don'ts
- ❌ More than 3 font sizes on one screen
- ❌ Bold random words — only genuinely important labels
- ❌ Center-align paragraphs over 2 lines
- ❌ Thin weights (100–300) for readable text
- ❌ `line-height: 1` on anything except single icons

---

## SECTION 4 — COLOR SYSTEM RULES

> **Phase 2 only. Mistral receives this section.**

### 4.1 — Mandatory CSS Custom Properties

Define ALL of these in `:root` before any other CSS. In Next.js: in `app/globals.css`.

```css
:root {
  --color-bg:            /* main page background */;
  --color-surface:       /* cards, panels, elevated elements */;
  --color-surface-2:     /* modals, popovers */;
  --color-border:        /* dividers, card borders */;
  --color-text:          /* primary text */;
  --color-text-muted:    /* secondary text */;
  --color-text-hint:     /* placeholder, disabled */;
  --color-accent:        /* ONE brand color — buttons, links, highlights */;
  --color-accent-hover:  /* 10-15% darker than accent */;
  --color-accent-light:  /* very light tint of accent */;
}
```

CRITICAL: Every color in component CSS must use `var(--color-name)`. Hardcoded hex in components = CRITICAL violation.

---

### 4.2 — Color Rules

| Rule | Constraint |
|---|---|
| 60-30-10 | 60% backgrounds, 30% surfaces, 10% accent. Never invert. |
| One accent | ONE accent color. Never two. Never a gradient on buttons. |
| Dark backgrounds | Never `#000000`. Use `#0f0f0f`, `#111111`, `#141414`. |
| Light backgrounds | `#f8f8f6` or `#f5f4f0`. Never pure `#ffffff` as outer background. |
| Card borders light | `rgba(0,0,0,0.08)`. Never solid black border on cards. |
| Text contrast | Body on bg: min 4.5:1 (WCAG AA). Large text 18px+: min 3:1. |
| Dark text | Never `#ffffff`. Use `#e8e8e8` or `#f0f0f0`. |

### 4.3 — Preset Palettes

| `colorPreference` | `--color-bg` | `--color-surface` | `--color-text` | `--color-accent` |
|---|---|---|---|---|
| `"light"` | `#f8f8f6` | `#ffffff` | `#111827` | `#2563eb` |
| `"dark"` | `#0f0f0f` | `#1a1a1a` | `#e8e8e8` | `#3b82f6` |
| `"warm"` | `#faf7f2` | `#ffffff` | `#1a1209` | `#c84b31` |
| `"earthy"` | `#f5f0e8` | `#ffffff` | `#1c1309` | `#3d6b4f` |
| `"luxury"` | `#0d0b08` | `#1a1712` | `#f0ede8` | `#c9a84c` |
| `"minimal"` | `#ffffff` | `#f9f9f7` | `#111111` | `#111111` |
| `"vibrant"` | `#f0f4ff` | `#ffffff` | `#0f172a` | `#6366f1` |

---

## SECTION 5 — SPACING, LAYOUT & ANIMATION RULES

> **Phase 2 only. Mistral receives this section.**

### 5.1 — Spacing System (4px base — STRICT)

> CRITICAL: ALL spacing must be multiples of 4px.
> Allowed: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
> Forbidden: 5, 7, 10, 15, 17, 22, 25, 30px — and anything not in the allowed list

| Context | Value |
|---|---|
| Badge padding, icon gaps | 8–12px |
| Button padding | 10px top/bottom, 18px left/right |
| Input padding | 10px top/bottom, 14px left/right |
| Card padding | 24px |
| Modal padding | 32px |
| Page content padding | 32px desktop / 16px mobile |
| Between cards in grid | 20px |
| Between page sections | 80px desktop / 48px mobile |
| Heading to body gap | 12px |
| Body to CTA gap | 24px |
| Max content width | 1200px |
| Max text column | 680px |

### 5.2 — Component Size Standards

| Component | Height | Border Radius | Notes |
|---|---|---|---|
| Button default | 40px | 8px | `font-weight: 600`, padding 10/18px |
| Button small | 32px | 6px | `font-size: 14px`, padding 6/12px |
| Button large | 48px | 10px | padding 14/24px |
| Input / Select | 40px | 8px | padding 10/14px |
| Card | auto | 12px | padding 24px, border `rgba(0,0,0,0.08)` |
| Modal | auto | 16px | max-width 520px, padding 32px |
| Badge / Pill | 22px | 99px | padding 2/10px, font-size 12px |
| Icon button | 36×36px | 6px | tap target min 44×44px on mobile |

### 5.3 — Responsive Breakpoints (3 only)

| Name | Width | Changes |
|---|---|---|
| Mobile | ≤ 640px | 1-column, sidebar→bottom tabs, hero stacks, padding 48px |
| Tablet | 641–1024px | 2-column, cards 2 per row |
| Desktop | ≥ 1025px | Full layout, 3-column grids, padding 80px |

- Body font: **NEVER below 16px** at any breakpoint
- Tap targets: **minimum 44×44px** on mobile
- CTA button: **always visible** — never hidden in collapsed nav

### 5.4 — Easing Dictionary (exact values — never substitute)

| Name | CSS / framer-motion value | Use for |
|---|---|---|
| Spring | `[0.34, 1.56, 0.64, 1.0]` | Tooltips, badges, name tags, success pops — satisfying moments |
| Ease-out | `[0.0, 0.0, 0.2, 1.0]` | Elements **entering** screen: modals open, toast in, scroll reveal |
| Ease-in | `[0.4, 0.0, 1.0, 1.0]` | Elements **leaving** screen: modals close, toast out, card dismiss |
| Ease-in-out | `[0.4, 0.0, 0.2, 1.0]` | Elements **moving** on screen: progress bar, search expand, sidebar |

**CRITICAL: Never use `transition: all`. Always name specific properties.**

### 5.5 — Timing Reference

| Interaction | Duration |
|---|---|
| Button hover/color | 150ms |
| Button press (scale) | 80ms |
| Tooltip show (after 800ms delay) | 200ms |
| Tooltip hide | 150ms |
| Toast enter | 350ms |
| Toast exit | 250ms |
| Scroll reveal | 450ms |
| Progress bar fill | 450ms |
| Card stack advance | 400ms |
| Search expand | 350ms |
| Shimmer sweep | 1500ms infinite |
| Name tag spring | 450ms |

---

## SECTION 6 — TRACK A: HTML GENERATION RULES

> **Phase 3 only. Qwen receives this section + Section 8.**
> **Used when `outputTrack = "html"` from Phase 1 JSON.**

### Track A Definition
- Output: **ONE file** — `index.html`. Nothing else.
- No npm. No `import`. No JSX. No build step.
- Preview: `iframe.srcdoc = htmlContent` — instant, zero infrastructure.
- Must work when opened directly in Chrome.

### 6.1 — File Structure Order
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- actual site name --></title>
  <!-- 1. Google Fonts preconnect + link tag -->
  <!-- 2. Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- 3. Other CDN CSS (AOS, Swiper) -->
  <!-- 4. Custom <style> with :root custom properties -->
</head>
<body>
  <!-- 5. Semantic HTML: nav, main, sections, footer -->
  <!-- 6. CDN JS scripts -->
  <script>/* All vanilla JS here */</script>
</body>
</html>
```

### 6.2 — Allowed CDN Libraries

| Library | CDN URL | Use for |
|---|---|---|
| Tailwind CSS | `https://cdn.tailwindcss.com` | All utility classes |
| AOS | `https://unpkg.com/aos@2.3.1/dist/aos.css` + js | Scroll animations |
| Lucide | `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js` | Icons |
| Swiper | `https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js` | Sliders |
| GSAP | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js` | Advanced animation |
| Chart.js | `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js` | Charts |
| Alpine.js | `https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js` | Reactive UI |

### 6.3 — Track A Forbidden Patterns
- ❌ Any `import` or `require` statement — zero npm packages
- ❌ `react-scroll` — use `scrollIntoView({behavior:'smooth'})` instead
- ❌ `fetch()` for data — all content must be static
- ❌ `<script type="module">` — plain `<script>` tags only
- ❌ References to files that don't exist — 100% self-contained

### 6.4 — Smooth Scroll (replaces react-scroll forever)
```html
<a href="#section-id">Link</a>

<script>
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault()
    document.querySelector(link.getAttribute('href'))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})
</script>
```

### 6.5 — Section Order by Site Type

| Type | Section order |
|---|---|
| Landing / SaaS | nav → hero → logo-bar → problem → features → how-it-works → testimonials → pricing → cta → footer |
| Restaurant / Cafe | nav → hero → about → menu → gallery → testimonials → location → contact → footer |
| Portfolio | nav → hero → about → work → skills → testimonials → contact → footer |
| Agency | nav → hero → services → process → portfolio → team → testimonials → contact → footer |
| Event | nav → hero → details → speakers → schedule → venue → tickets → footer |

---

## SECTION 7 — TRACK B: NEXT.JS GENERATION RULES

> **Phase 3 only. Qwen receives this section + Section 8 + Section 9.**
> **Used when `outputTrack = "nextjs"` from Phase 1 JSON.**

### Track B Definition
- Framework: **Next.js 14+ with App Router**
- Files generated **one at a time** — one Qwen call per file
- Maximum **300 lines per file** — split if approaching limit
- Preview: server-side `npm install && npm run build` → Netlify deploy → iframe URL
- Every interactive component file: **`'use client'` at the top — no exceptions**

### 7.1 — Required File Structure

```
app/
  layout.tsx          ← Root layout with fonts (next/font/google) + metadata
  globals.css         ← :root custom properties + keyframes + reduced-motion
  page.tsx            ← Home page (server component, no 'use client')
  [route]/
    page.tsx          ← Additional pages

components/
  ui/                 ← All reusable UI components (see Section 9)
  sections/           ← Page-level sections (HeroSection, FeaturesSection, etc.)

public/               ← Static assets only
tailwind.config.ts    ← Extended with custom animation tokens
next.config.ts        ← Basic Next.js config
package.json          ← Only allowed packages
```

### 7.2 — Required package.json (EXACT — add nothing else)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

### 7.3 — Allowed packages for complex apps (add only when needed)

| Package | Use for |
|---|---|
| `react-hook-form` | Form state |
| `@tanstack/react-query` | Data fetching |
| `axios` | HTTP requests |
| `date-fns` | Date formatting |
| `recharts` | Data charts |
| `react-hot-toast` | Toast (only if not using Section 9 component) |
| `zustand` | Global state |
| `zod` | Data validation |
| `@hookform/resolvers` | Zod + react-hook-form bridge |
| `@radix-ui/react-dialog` | Accessible modals |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-select` | Select inputs |

### 7.4 — Permanently Blocked Packages

| Blocked | Use instead |
|---|---|
| `react-scroll` | `element.scrollIntoView({behavior:'smooth'})` |
| `react-slick` | `framer-motion` or CSS scroll-snap |
| `moment` | `date-fns` |
| `lodash` | Native Array/Object methods |
| `jquery` | Never |
| `styled-components` | Tailwind CSS |
| `emotion` | Tailwind CSS |
| `bootstrap` | Tailwind CSS |
| `@mui`, `ant-design`, `chakra-ui` | Tailwind + Radix UI |
| `react-spring` | `framer-motion` |
| `three.js` | CSS 3D transforms |

### 7.5 — Next.js File Rules

- `app/layout.tsx`: load fonts via `next/font/google`, set `<html>` className, add `<meta>` tags
- `app/globals.css`: all `:root` custom properties + keyframes + reduced-motion reset
- `app/page.tsx`: server component by default — no `'use client'` unless directly using hooks
- `components/ui/*.tsx`: all have `'use client'` — all use framer-motion + Tailwind
- `tailwind.config.ts`: must include all animation tokens from Section 9

### 7.6 — Required tailwind.config.ts

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2899d2',
        'primary-hover': '#1979b0',
        canvas: '#f7f8f9',
        surface: '#ffffff',
        border: '#e5e7eb',
        't1': '#111827',
        't2': '#374151',
        't3': '#6b7280',
        't4': '#9ca3af',
      },
      transitionTimingFunction: {
        spring:    'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
        'ease-out-motion': 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
        'ease-in-motion':  'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
        'ease-inout-motion': 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
      },
      keyframes: {
        shimmer:  { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        toastIn:  { from: { opacity: '0', transform: 'translateY(16px) scale(0.95)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        toastOut: { from: { opacity: '1', transform: 'translateY(0) scale(1)' }, to: { opacity: '0', transform: 'translateY(-8px) scale(0.95)' } },
        popIn:    { '0%': { opacity: '0', transform: 'scale(0.7) translateY(4px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        stepIn:   { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        stepOut:  { from: { opacity: '1', transform: 'translateX(0)' }, to: { opacity: '0', transform: 'translateX(-16px)' } },
      },
      animation: {
        shimmer:  'shimmer 1.5s infinite',
        toastIn:  'toastIn 0.35s cubic-bezier(0.0,0.0,0.2,1.0) forwards',
        toastOut: 'toastOut 0.25s cubic-bezier(0.4,0.0,1.0,1.0) forwards',
        popIn:    'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1.0) forwards',
        stepIn:   'stepIn 0.35s cubic-bezier(0.0,0.0,0.2,1.0) forwards',
        stepOut:  'stepOut 0.2s cubic-bezier(0.4,0.0,1.0,1.0) forwards',
      },
    },
  },
  plugins: [],
}
export default config
```

### 7.7 — Required globals.css additions

```css
/* Reduced motion override — always include */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* Shimmer progress bar */
@keyframes progressFill {
  from { width: 100%; }
  to   { width: 0%; }
}
```

### 7.8 — Project Glossary (injected into every Phase 3 file prompt)

Built during Phase 2. Injected into every Qwen call. Use EXACTLY these names — never invent alternatives.

```json
{
  "primaryComponent": "App",
  "apiBaseUrl": "/api",
  "primaryColor": "value from --color-accent",
  "modelNames": {},
  "routePaths": { "home": "/" },
  "componentNames": {}
}
```

---

## SECTION 8 — CODE QUALITY RULES

> **Phase 3 always — injected alongside Section 6 or Section 7.**
> **Also used by the post-generation validator for every file.**

### 8.1 — Master Rules Table

| # | Severity | Rule | Detail |
|---|---|---|---|
| 1 | **CRITICAL** | No inline styles | Never `style=""` on elements. All styles in CSS or `<style>` tag. |
| 2 | **CRITICAL** | No hardcoded hex in components | All colors via `var(--color-name)`. Hex outside `:root` = violation. |
| 3 | **CRITICAL** | No off-scale spacing | Allowed: 4,8,12,16,20,24,32,40,48,64,80,96px only. |
| 4 | **CRITICAL** | No forbidden packages | Track B: only packages from Section 7.2 and 7.3. |
| 5 | **CRITICAL** | No lorem ipsum | All text contextually appropriate for the site type. |
| 6 | **CRITICAL** | No `console.log` | Remove all `console.log`, `.error`, `.warn`. |
| 7 | **CRITICAL** | No TODO/FIXME | No `TODO`, `FIXME`, `HACK`, `XXX` comments. |
| 8 | **CRITICAL** | No commented-out code | Remove all dead code. Explanatory comments allowed. |
| 9 | **MUST** | One `<h1>` per page | Exactly one H1. Never zero. Never two. |
| 10 | **MUST** | Sequential headings | H1→H2→H3 only. Never skip levels. |
| 11 | **MUST** | All `<img>` have `alt` | Decorative: `alt=""`. Meaningful: describe the image. |
| 12 | **MUST** | All inputs have labels | `<label for="id">` or `aria-label`. Placeholder ≠ label. |
| 13 | **MUST** | Icon buttons have `aria-label` | `<button aria-label="Close modal">` — never icon alone. |
| 14 | **MUST** | Focus states on all interactive | `box-shadow: 0 0 0 3px var(--color-accent)` at 40% opacity. |
| 15 | **MUST** | Escape closes modals | Every modal/dropdown closes on Escape key. |
| 16 | **MUST** | Semantic HTML | `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`. |
| 17 | **MUST** | Copyright year via JS | `new Date().getFullYear()` — never hardcode. |
| 18 | **MUST** | Images use placehold.co | `https://placehold.co/WxH` — never Lorem Picsum. |
| 19 | **MUST** | Reduced motion override | All keyframes inside `@media (prefers-reduced-motion: no-preference)`. |
| 20 | **MUST** | Body font min 16px | Never below 16px at any breakpoint. 14px for secondary text only. |
| 21 | **MUST** | Mobile tap targets 44px | `min-height: 44px; min-width: 44px` for all clickable elements. |
| 22 | **MUST** | No `transition: all` | Always name specific properties. |
| 23 | **MUST** | No `!important` in components | Only in utility class definitions. |
| 24 | **MUST** | No manual vendor prefixes | Never `-webkit-`, `-moz-`, `-ms-`. |

### 8.2 — Pre-Output Self-Check

Before outputting any file, verify every item:

```
[ ] All colors use var(--color-name)? No hex outside :root?
[ ] All spacing on 4px scale? (4,8,12,16,20,24,32,40,48,64,80,96)
[ ] All imports in allowed package list? (Track B only)
[ ] Zero console.log, TODO, FIXME, commented-out code?
[ ] Every <img> has alt attribute?
[ ] Every input has label or aria-label?
[ ] Every icon-only button has aria-label?
[ ] Exactly one <h1> on the page?
[ ] Heading levels sequential (no skips)?
[ ] Every button has active press state (scale 0.97)?
[ ] transition: all used anywhere? (Remove it)
[ ] Any inline style="" attributes? (Remove them)
[ ] Lorem ipsum anywhere? (Replace it)
[ ] Track A: any import statements? (Must be zero)
[ ] Track B: 'use client' on all interactive components?
[ ] Iteration: only touched files listed in filesToTouch?
```

### 8.3 — Validator Fix Prompts

| Violation | Fix prompt to send | Max retries |
|---|---|---|
| `FORBIDDEN_PACKAGE` | "Remove import of `[pkg]`. Implement with vanilla JS instead. Return ONLY the corrected file." | 2 |
| `HARDCODED_COLOR` | "Replace all hardcoded hex with CSS custom properties from `:root`. Return ONLY the corrected file." | 2 |
| `INVALID_SPACING` | "Replace all off-scale spacing values with nearest allowed: 4,8,12,16,20,24,32,40,48,64,80,96. Return ONLY the corrected file." | 2 |
| `CONSOLE_LOG` | "Remove all console.log/error/warn. Return ONLY the corrected file." | 1 |
| `LOREM_IPSUM` | "Replace lorem ipsum with contextually appropriate content for a `[siteType]`. Return ONLY the corrected file." | 1 |
| `MISSING_ALT` | "Add alt attributes to all img tags. Decorative: alt=\"\". Meaningful: describe the image. Return ONLY the corrected file." | 1 |
| `INLINE_STYLE` | "Move all inline style attributes to CSS. Return ONLY the corrected file." | 2 |

---

## SECTION 9 — NEXT.JS COMPONENT LIBRARY

> **Phase 3 Track B only. Injected alongside Section 7 + Section 8.**
> **These are the 11 animation components extracted from the animation reference file.**
> **When generating any component for a Next.js site, use THESE patterns exactly.**

### Component Map — User request to component

| Page needs / User asks for | Component to use |
|---|---|
| Any button, CTA, form submit | `Button` (C01) |
| Keyboard shortcut, ⌘K hint | `KbdShortcut` (C02) |
| Notification, alert, success/error message | `Toast` + `ToastProvider` (C03) |
| Team section, user avatars, contributors | `Avatar` with name tag (C04) |
| Loading state, data fetching | `Skeleton` / `SkeletonCard` (C05) |
| Icon toolbar, editor buttons | Icon buttons with `Tooltip` (C06) |
| Tech mentions, inline link previews | `HoverPreview` (C07) |
| Multi-step form, onboarding, checkout | `ProgressStepper` (C08) |
| Notification stack, task queue | `CardStack` (C09) |
| Nav search, header search | `SearchBar` (C10) |
| Pricing limits, plan comparison rows | `UpgradeRow` (C11) |
| Every content section, every card | Wrap with `RevealOnScroll` (C00) |

**NEVER replace these with alternatives:**
- ❌ `react-tooltip` → use C06 Tooltip
- ❌ `react-toastify` / `sonner` → use C03 Toast
- ❌ CSS `fadeIn` for reveals → use C00 RevealOnScroll
- ❌ Any slider/carousel library → use C09 CardStack or CSS scroll-snap

---

### C00 — RevealOnScroll (wrap every section)

```tsx
'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface RevealProps {
  children: React.ReactNode
  delay?: number   // milliseconds, for stagger
  className?: string
}

export function RevealOnScroll({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px', amount: 0.12 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1.0], delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger pattern for card grids:
// <RevealOnScroll delay={0}>  <Card /></RevealOnScroll>
// <RevealOnScroll delay={60}> <Card /></RevealOnScroll>
// <RevealOnScroll delay={120}><Card /></RevealOnScroll>
// Stagger: 60ms per element — never 30ms (too fast) or 100ms (too slow)
```

---

### C01 — Button

```tsx
'use client'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'brand' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-[#111827] text-white hover:bg-[#1f2937]',
  secondary: 'bg-white text-[#374151] border border-[#e5e7eb] hover:bg-[#f9fafb]',
  brand:     'bg-[#2899d2] text-white hover:bg-[#1979b0]',
  danger:    'bg-[#991b1b] text-white hover:bg-[#7f1d1d]',
}

export function Button({
  variant = 'primary', children, onClick, className, disabled, type = 'button'
}: {
  variant?: ButtonVariant; children: React.ReactNode; onClick?: () => void
  className?: string; disabled?: boolean; type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}                        // press — mandatory
      transition={{ duration: 0.08 }}
      className={clsx(
        'inline-flex items-center justify-center gap-[7px]',
        'px-[18px] py-[10px] rounded-lg',
        'text-[13.5px] font-semibold cursor-pointer',
        'transition-[background-color,border-color] duration-150', // never transition:all
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], className
      )}
    >
      {children}
    </motion.button>
  )
}
```

**Slide-up text button (dual layer hover):**
```tsx
'use client'
import { motion } from 'framer-motion'

export function SlideButton({ label, hoverLabel }: { label: string; hoverLabel: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className="group relative h-10 px-[18px] overflow-hidden rounded-lg bg-[#111827] text-white text-[13.5px] font-semibold cursor-pointer inline-flex items-center justify-center"
    >
      {/* Default text slides up on hover */}
      <span className="block transition-[transform,opacity] duration-300 ease-[cubic-bezier(0,0,0.2,1)] group-hover:-translate-y-full group-hover:opacity-0">
        {label}
      </span>
      {/* Hover text slides in from below */}
      <span className="absolute inset-0 flex items-center justify-center translate-y-full opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0,0,0.2,1)] group-hover:translate-y-0 group-hover:opacity-100">
        {hoverLabel}
      </span>
    </motion.button>
  )
}
```

---

### C02 — KbdShortcut

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function KbdShortcut({ keys, label }: { keys: string[]; label: string }) {
  const [firing, setFiring] = useState(false)
  const [success, setSuccess] = useState(false)

  const fire = () => {
    setFiring(true)
    setTimeout(() => {
      setFiring(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    }, 300)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-[#374151]">{label}</span>
      <div
        onClick={fire}
        className="flex items-center gap-[6px] px-[14px] py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg cursor-pointer hover:border-[#2899d2] transition-[border-color] duration-150"
      >
        {keys.map((k, i) => (
          <motion.kbd
            key={i}
            animate={firing
              ? { scale: 0.88, borderColor: '#2899d2', boxShadow: '0 0 0 3px rgba(40,153,210,0.10)' }
              : { scale: 1,    borderColor: '#d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
            }
            transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="px-[7px] py-[2px] bg-white border rounded-[5px] font-mono text-[11px] text-[#374151]"
          >
            {k}
          </motion.kbd>
        ))}
      </div>
      <AnimatePresence>
        {success && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1.0] }} // spring
            className="text-[12px] font-semibold text-[#16a34a] flex items-center gap-1"
          >
            ✓ Done
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### C03 — Toast Notifications

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { createContext, useContext } from 'react'

type ToastType = 'info' | 'success' | 'error'
interface Toast { id: string; type: ToastType; title: string; message: string }

const ToastContext = createContext<{ show: (type: ToastType, title: string, message: string) => void }>({ show: () => {} })
export const useToast = () => useContext(ToastContext)

const bgMap = { info: 'bg-[#111827]', success: 'bg-[#15803d]', error: 'bg-[#991b1b]' }
const autoMap = { info: true, success: true, error: false }  // error = manual dismiss only

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => {
      const next = [...prev, { id, type, title, message }]
      return next.length > 3 ? next.slice(-3) : next  // max 3 toasts
    })
    if (autoMap[type]) setTimeout(() => remove(id), 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{
                enter: { duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] },
                exit:  { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] }
              }}
              className={`flex items-start gap-[10px] px-4 py-[13px] rounded-[10px] text-white min-w-[280px] max-w-[360px] shadow-[0_4px_20px_rgba(0,0,0,0.18)] pointer-events-auto relative overflow-hidden ${bgMap[t.type]}`}
            >
              <div className="flex-1">
                <div className="font-semibold text-[13px]">{t.title}</div>
                <div className="text-[12px] opacity-80 mt-[2px]">{t.message}</div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-white/60 hover:text-white text-[16px] bg-transparent border-0 cursor-pointer"
                aria-label="Close notification"
              >
                ×
              </button>
              {autoMap[t.type] && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
                  <div className="h-full bg-white/50 animate-[progressFill_4s_linear_forwards]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
// Usage: wrap app/layout.tsx children with <ToastProvider>
// In component: const { show } = useToast(); show('success', 'Saved!', 'Your changes are live.')
```

---

### C04 — Avatar with Name Tag

```tsx
'use client'
import { motion } from 'framer-motion'

export function Avatar({ initials, color, name }: { initials: string; color: string; name: string }) {
  return (
    <div className="relative inline-flex cursor-pointer group">
      {/* Name tag — spring animation, slight tilt */}
      <motion.div
        initial={{ opacity: 0, y: 8, x: '-50%', rotate: -2 }}
        whileHover={{ opacity: 1, y: 0, x: '-50%', rotate: -2 }}
        transition={{ opacity: { duration: 0.2 }, y: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1.0] } }}
        className="absolute bottom-[calc(100%+10px)] left-1/2 bg-[#111827] text-white px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap pointer-events-none z-10"
        style={{ translateX: '-50%' }}
      >
        {name}
        {/* Arrow pointing down */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#111827]" />
      </motion.div>

      {/* Avatar circle */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.2 }}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white border-2 border-[#e5e7eb]"
        style={{ background: color }}
      >
        {initials}
      </motion.div>
    </div>
  )
}

// Avatar group (overlapping):
// <div className="flex">
//   <Avatar initials="AJ" color="linear-gradient(135deg,#667eea,#764ba2)" name="Alex Johnson" />
//   <div className="-ml-[10px]"><Avatar ... /></div>
// </div>
```

---

### C05 — Skeleton Loader

```tsx
import { clsx } from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded bg-[#e5e7eb]',
        'after:absolute after:inset-0 after:animate-shimmer',
        'after:bg-[length:200%_100%]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4 w-full">
      <div className="flex items-center gap-[10px] mb-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-[6px]">
          <Skeleton className="h-3 w-[55%]" />
          <Skeleton className="h-[10px] w-[35%]" />
        </div>
      </div>
      <Skeleton className="h-[10px] w-[90%] mb-[6px]" />
      <Skeleton className="h-[10px] w-[75%] mb-3" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  )
}
// Skeleton shapes must EXACTLY match the real content they replace
// Transition from skeleton to content: opacity 0→1 over 250ms — never instant swap
```

---

### C06 — Delayed Tooltip (800ms delay)

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'

export function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 800) }} // 800ms delay
      onMouseLeave={() => { clearTimeout(timer.current); setVisible(false) }}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.93 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1.0] }, y: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1.0] } }}
            className="absolute bottom-[calc(100%+8px)] left-1/2 bg-[#111827] text-white px-[10px] py-[5px] rounded-md text-[11.5px] whitespace-nowrap pointer-events-none z-[100]"
            style={{ translateX: '-50%' }}
          >
            {label}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#111827]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### C07 — HoverPreview Card

```tsx
'use client'
import { motion } from 'framer-motion'

export function HoverPreview({ text, previewContent, previewLabel }: {
  text: string; previewContent: React.ReactNode; previewLabel: string
}) {
  return (
    <span className="relative inline-block cursor-default underline decoration-dotted underline-offset-[3px] text-[#2899d2] font-medium group">
      {text}
      <motion.div
        initial={{ opacity: 0, y: 10, x: '-50%', scale: 0.93 }}
        whileHover={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
        transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1.0] }, y: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1.0] } }}
        className="absolute bottom-[calc(100%+12px)] left-1/2 w-[180px] rounded-xl overflow-hidden bg-white border border-[#e5e7eb] shadow-[0_8px_32px_rgba(0,0,0,0.13)] pointer-events-none z-[200]"
        style={{ translateX: '-50%' }}
      >
        <div className="w-full h-[90px] flex items-center justify-center">{previewContent}</div>
        <div className="px-3 py-2 text-[12px] font-medium text-[#374151]">{previewLabel}</div>
      </motion.div>
    </span>
  )
}
```

---

### C08 — ProgressStepper

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function ProgressStepper({ steps }: { steps: string[] }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (dir: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, current + dir))
    if (next === current) return
    setDirection(dir)
    setCurrent(next)
  }

  return (
    <div className="w-full">
      {/* Progress track */}
      <div className="w-full h-[5px] bg-[#e5e7eb] rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-[#2899d2] rounded-full"
          animate={{ width: `${(current / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.45, ease: [0.4, 0.0, 0.2, 1.0] }} // ease-in-out
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between mb-4">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i <= current ? '#2899d2' : '#e5e7eb',
              scale: i === current ? 1.2 : i < current ? 1.2 : 1,
              boxShadow: i === current ? '0 0 0 3px rgba(40,153,210,0.10)' : '0 0 0 0 transparent'
            }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1.0] }} // spring on dots
            className="w-2 h-2 rounded-full"
          />
        ))}
      </div>

      {/* Step content with directional slide */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={{
              enter: (d) => ({ x: d > 0 ? 16 : -16, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d) => ({ x: d > 0 ? -16 : 16, opacity: 0 })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="text-[13px] text-[#374151] text-center py-2"
          >
            {steps[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center mt-3">
        <button onClick={() => go(-1)} className="text-[12px] px-3 py-[7px] rounded-lg bg-white border border-[#e5e7eb] hover:bg-[#f9fafb]">← Back</button>
        <button onClick={() => go(1)}  className="text-[12px] px-3 py-[7px] rounded-lg bg-[#111827] text-white hover:bg-[#1f2937]">Next →</button>
      </div>
    </div>
  )
}
```

---

### C09 — CardStack

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface StackCard { icon: string; title: string; subtitle: string }

const positions = [
  { y: 0,  scale: 1,    zIndex: 3, bg: 'bg-white border-[#e5e7eb] shadow-[0_4px_16px_rgba(0,0,0,0.08)]' },
  { y: 8,  scale: 0.96, zIndex: 2, bg: 'bg-[#f3f4f6] border-[#e5e7eb]' },
  { y: 16, scale: 0.92, zIndex: 1, bg: 'bg-[#e9ebee] border-[#e0e2e6]' },
]

export function CardStack({ cards }: { cards: StackCard[] }) {
  const [stack, setStack] = useState(cards)

  const dismiss = () => {
    setStack(prev => prev.slice(1))
  }

  if (stack.length === 0) {
    return <div className="text-center text-[#9ca3af] text-[13px] py-5">All caught up! 🎉</div>
  }

  return (
    <div className="relative w-[260px] h-[100px] cursor-pointer mx-auto" onClick={dismiss}>
      <AnimatePresence>
        {stack.slice(0, 3).map((card, i) => {
          const pos = positions[i]
          return (
            <motion.div
              key={card.title}
              layout
              initial={i === 0 ? { x: '120%', rotate: 8, opacity: 0 } : false}
              animate={{ y: pos.y, scale: pos.scale, x: 0, rotate: 0, opacity: 1, zIndex: pos.zIndex }}
              exit={{ x: '120%', rotate: 8, opacity: 0, zIndex: 10 }}
              transition={{
                x: { duration: 0.35, ease: [0.4, 0.0, 1.0, 1.0] }, // ease-in for exit
                y: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1.0] },   // ease-in-out for advance
                scale: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1.0] }
              }}
              className={`absolute inset-0 rounded-xl flex items-center px-4 py-[14px] gap-[10px] border ${pos.bg}`}
            >
              <span className="text-[20px]">{card.icon}</span>
              <div>
                <div className="font-semibold text-[12.5px] text-[#111827]">{card.title}</div>
                <div className="text-[11px] text-[#9ca3af]">{card.subtitle}</div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
// Rotation on dismiss (rotate: 8) is mandatory — makes it feel physical
```

---

### C10 — SearchBar

```tsx
'use client'
import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

export function SearchBar() {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const expand = () => {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50) // focus immediately
  }

  const collapse = () => {
    setQuery('')
    setExpanded(false)
  }

  // Collapse on click outside — only if empty
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-search]') && query === '') {
        setExpanded(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [query])

  return (
    <div data-search className="relative flex items-center">
      {/* Search icon button — hides when expanded */}
      <motion.button
        animate={{ opacity: expanded ? 0 : 1, pointerEvents: expanded ? 'none' : 'auto' }}
        transition={{ duration: 0.2 }}
        onClick={expand}
        className="w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-[#f3f4f6] border border-[#e5e7eb] text-[#6b7280] hover:bg-white hover:text-[#111827] transition-[background,color] duration-150"
        aria-label="Open search"
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </motion.button>

      {/* Expandable input */}
      <motion.div
        animate={{ width: expanded ? 200 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0.0, 0.2, 1.0] }} // ease-in-out
        className="overflow-hidden"
        style={{ marginLeft: expanded ? -28 : 0 }}
      >
        <div className="relative">
          <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-[34px] pl-8 pr-8 bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg text-[13px] text-[#111827] outline-none"
          />
          {expanded && (
            <button
              onClick={collapse}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#d1d5db] hover:bg-[#9ca3af] hover:text-white text-[#6b7280] text-[10px]"
              aria-label="Close search"
            >
              ×
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

---

### C11 — UpgradeRow

```tsx
'use client'
import { motion } from 'framer-motion'

export function UpgradeRow({ feature, current, upgraded }: {
  feature: string; current: string; upgraded: string
}) {
  return (
    <motion.div
      className="flex items-center justify-between px-[14px] py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-lg mb-2 cursor-default gap-2"
      initial="rest"
      whileHover="hover"
    >
      <span className="text-[13px] text-[#374151] font-medium flex-shrink-0">{feature}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sliding text container */}
        <div className="relative overflow-hidden h-5 min-w-[60px] flex items-center justify-end">
          {/* Current limit slides out upward */}
          <motion.span
            variants={{ rest: { y: 0, opacity: 1 }, hover: { y: '-110%', opacity: 0 } }}
            transition={{ duration: 0.25, ease: [0.4, 0.0, 0.2, 1.0] }}
            className="text-[13px] text-[#6b7280] whitespace-nowrap"
          >
            {current}
          </motion.span>
          {/* Upgraded limit slides in from below */}
          <motion.span
            variants={{ rest: { y: '110%', opacity: 0 }, hover: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="absolute right-0 text-[13px] font-semibold text-[#2899d2] whitespace-nowrap"
          >
            {upgraded}
          </motion.span>
        </div>
        {/* PRO badge — OUTSIDE sliding container, never moves */}
        <span className="inline-flex items-center px-2 py-[2px] rounded-full text-white text-[10px] font-bold tracking-[0.04em] bg-gradient-to-br from-[#2899d2] to-[#6366f1] flex-shrink-0">
          PRO
        </span>
      </div>
    </motion.div>
  )
}
```

---

## SECTION 10 — ITERATION RULES

> **ALWAYS inject this section FIRST for follow-up prompts in an existing workspace.**

### 10.1 — Required Classification Output

Before touching any file, output this JSON:

```json
{
  "editScope": "scoped",
  "editType": "color_change",
  "filesToTouch": ["app/globals.css"],
  "specificChange": "Change --color-accent from #2563eb to #dc2626 in :root",
  "doNotTouch": "all other files",
  "requiresFullRegeneration": false
}
```

### 10.2 — Scope Definitions

| Scope | Use when | Max files |
|---|---|---|
| SCOPED | Color, font, single text, single component style | 1–2 files |
| MEDIUM | New section, new feature, new route | 2–4 files |
| FULL | User says "redesign", "start over", "change the whole layout" | All files |

### 10.3 — Change Type to File Map

| User says | Scope | Files to touch | What to change |
|---|---|---|---|
| "Change the color to X" | SCOPED | `app/globals.css` `:root` block only | `--color-accent` value only |
| "Change the font" | SCOPED | `app/globals.css` + `app/layout.tsx` | `next/font` import + CSS variable |
| "Change the hero text" | SCOPED | `components/sections/HeroSection.tsx` | Only the specific text string |
| "Make it dark mode" | SCOPED | `app/globals.css` `:root` block only | All `--color-*` values |
| "Add a contact form" | MEDIUM | New component + page update | Add section, styles, validation |
| "Add pricing section" | MEDIUM | New component + page update | Add section after features |
| "Make it responsive" | MEDIUM | `app/globals.css` only | Add media queries |
| "Add animations" | MEDIUM | Component files + globals | Add framer-motion variants |

### 10.4 — Iteration Don'ts
- ❌ Change files not listed in `filesToTouch`
- ❌ Restructure HTML the user didn't ask to change
- ❌ "Improve" other things while making a specific change
- ❌ Add unrequested features
- ❌ Change variable names in files you're editing for another reason

---

## QUICK REFERENCE

### Two tracks only
```
"html"   → Track A → single index.html → iframe srcdoc preview
"nextjs" → Track B → Next.js 14 App Router → build → Netlify → iframe URL
```

### Phase injection map
```
Phase 1 (Mistral):         Section 2
Phase 2 (Mistral):         Sections 3 + 4 + 5
Phase 3 Track A (Qwen):    Section 6 + Section 8
Phase 3 Track B (Qwen):    Section 7 + Section 8 + Section 9
Validator:                  Section 8
Iteration (Mistral+Qwen):  Section 10 FIRST → then relevant sections
```

### Easing values
```
Spring   [0.34, 1.56, 0.64, 1.0]  → tooltips, badges, name tags, success pops
Ease-out [0.0,  0.0,  0.2,  1.0]  → things entering the screen
Ease-in  [0.4,  0.0,  1.0,  1.0]  → things leaving the screen
In-out   [0.4,  0.0,  0.2,  1.0]  → things moving within the screen
```

### Always forbidden
```
NEVER:  import/require in Track A
NEVER:  react-scroll (use scrollIntoView)
NEVER:  hex colors in component CSS (use var(--color-name))
NEVER:  spacing off the 4px scale
NEVER:  lorem ipsum
NEVER:  console.log in output
NEVER:  TODO/FIXME comments
NEVER:  transition: all
NEVER:  packages not in Section 7.2 or 7.3
NEVER:  more than one <h1> per page
NEVER:  <img> without alt
NEVER:  <input> without label
NEVER:  icon button without aria-label
NEVER:  inline style="" attributes
NEVER:  hardcoded copyright years
NEVER:  <link> tags for fonts in Next.js (use next/font/google)
NEVER:  a third output track — only "html" and "nextjs" exist
```

---

*StackForge AI Master Rulebook v2.0 — Next.js Edition*
*Two tracks: HTML (instant srcdoc preview) and Next.js (build + deploy)*
*Every rule exists because a real generation error occurred without it.*