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
