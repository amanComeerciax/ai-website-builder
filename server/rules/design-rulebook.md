# THE SOLO DEV DESIGN RULEBOOK

### Ship Beautiful UI Without a Designer

> Copy this entire document and paste it as context to any AI (ChatGPT, Claude, Cursor, Copilot, v0, etc.) before asking it to design anything. The AI will follow these rules automatically.

---

## SECTION 0 — HOW TO USE THIS RULEBOOK

Paste this rulebook into your AI tool and say:

> _"Follow the design rulebook I've provided. Now build me [X]."_

That's it. Every rule below is written so an LLM can parse and execute it without asking you clarifying questions.

---

## SECTION 1 — TYPOGRAPHY

### 1.1 Font Pairing (MANDATORY)

- Always use **2 fonts maximum**: one for headings, one for body.
- Heading font: choose something with **personality** — a serif, a geometric sans, or a display font.
- Body font: choose something **highly readable** — clean, neutral, medium weight.
- Never use Arial, Times New Roman, or Comic Sans.
- Avoid overused system fonts (Inter alone, Roboto alone) — always pair them with something distinctive if you must use them.
- **Don't use the same fonts as everyone else** — when your fonts blend in, your design blends in.

**CRITICAL — Landing pages vs Product UI font rules are different:**

| Context                  | Heading font                                | Body font                        |
| ------------------------ | ------------------------------------------- | -------------------------------- |
| Landing page / marketing | Display or serif (Fraunces, Playfair, Syne) | Readable sans (Figtree, DM Sans) |
| Dashboard / app UI       | Same sans as body, heavier weight (600–700) | Readable sans (Figtree, DM Sans) |

- ❌ **Never use a display or serif font inside a product dashboard** — page titles like "Dashboard", section headers like "Recent Links", KPI labels like "48,293" must all use the body font at heavier weight
- Serif/display fonts belong on landing pages and marketing. Inside the app, everything is the body font at different weights and sizes.
- The heading font pairing only applies to the `<h1>` on marketing pages — not to UI chrome

**Find distinctive free fonts at:**

- `fontshare.com` — clean, high quality, completely free
- `uncut.wtf` — more experimental, full of personality

**Approved heading fonts (pick one per project):**
`Playfair Display`, `Fraunces`, `Syne`, `DM Serif Display`, `Clash Display`, `Cabinet Grotesk`, `Archivo Black`, `Bebas Neue`, `Cormorant Garamond`

**Approved body fonts (pick one per project):**
`DM Sans`, `Plus Jakarta Sans`, `Outfit`, `Nunito`, `Lato`, `Source Sans 3`, `Figtree`, `Manrope`

**MANDATORY — Always load fonts via Google Fonts `<link>` tag:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=HEADING_FONT&family=BODY_FONT&display=swap"
  rel="stylesheet"
/>
```

❌ Never rely on system fonts. If the `<link>` tag is missing, the font pair will silently fall back to Arial or Times New Roman and the entire design collapses.

### 1.2 Type Scale (STRICT)

Use a **modular scale** (1.25× or 1.333×). Never pick font sizes randomly.

| Level | Size (base 16px) | Usage                       |
| ----- | ---------------- | --------------------------- |
| xs    | 12px             | Labels, captions, metadata  |
| sm    | 14px             | Secondary text, helper text |
| base  | 16px             | Body copy                   |
| md    | 18–20px          | Lead text, subtitles        |
| lg    | 24–28px          | Section headings (H3)       |
| xl    | 32–36px          | Page subheadings (H2)       |
| 2xl   | 48–56px          | Page titles (H1)            |
| 3xl   | 64–80px          | Hero headlines only         |

### 1.3 Font Weight Rules

- Use **maximum 3 weights** per design: regular (400), medium (500), bold (700).
- Thin weights (100–300) only for large decorative text, never body.
- Bold headings: 700–800. Body: 400. UI labels: 500–600.

### 1.4 Line Height & Spacing

- Body text: `line-height: 1.6–1.75`
- Headings: `line-height: 1.1–1.25` (tighter as size increases)
- Letter spacing for headings: `letter-spacing: -0.02em` to `-0.04em` (slightly tighter)
- Letter spacing for ALL CAPS labels: `letter-spacing: 0.08em–0.12em` (wider)
- Never use `line-height: 1` on anything but single-character icons.

### 1.5 Kerning on Large Text (CRITICAL)

- At sizes **below ~70px**, default browser kerning is fine.
- At **70px and above** (hero headlines, large display text), always set explicit letter-spacing.
- Use `-0.02em` to `-0.04em` as the reliable range — `-2% to -4%` in Figma terms.
- Without this, large text looks disjointed even with a great font — letter gaps become visibly uneven at scale.
- This is one of the most common things that makes developer-built hero sections look unpolished.

### 1.5 Text Hierarchy — DO's and DON'Ts

✅ DO: Create clear contrast between heading and body (size, weight, or color)  
✅ DO: Use size AND weight together for emphasis  
✅ DO: Keep paragraphs to 60–75 characters wide (optimal reading)  
❌ DON'T: Use more than 3 different font sizes on one screen  
❌ DON'T: Bold random words — only bold for genuine importance  
❌ DON'T: Use italic for anything except quotes or technical terms  
❌ DON'T: Center-align long paragraphs (only short headlines)

---

## SECTION 2 — COLOR

### 2.1 The Color System (MANDATORY STRUCTURE)

Every design must define exactly these roles:

```
--color-bg:         main background
--color-surface:    cards, panels, elevated elements
--color-border:     subtle dividers
--color-text:       primary text
--color-text-muted: secondary/helper text
--color-accent:     ONE brand/action color (buttons, links, highlights)
--color-accent-hover: darker/lighter version of accent
```

Never introduce a color that doesn't map to one of these roles.

### 2.2 Color Palette Rules

- **60-30-10 rule**: 60% background/neutral, 30% surface/secondary, 10% accent
- Pick ONE accent color. Make it decisive. Not two. Not three.
- Dark mode: use `hsl()` colors — much easier to adjust lightness
- Light mode: off-white backgrounds (`#F8F8F6`, `#F5F4F0`) look more premium than pure white
- Dark mode: near-black (not pure black — use `#0F0F0F`, `#111111`, `#141414`)
- **Never use pure black (`#000000`) as a dark background** — always use a very dark tinted version of your accent color (e.g. a very dark navy instead of pure black). It looks far more intentional.

### 2.2a The HSB Method — Building Matching Palettes

When you need multiple tones that actually harmonize (e.g. background → surface → card), use HSB color mode and follow this system rather than guessing:

**Start with a base color.** Use a generator like Coolors if needed.

**To create a darker shade from any base:**

1. Keep Hue the same (or shift slightly — see below)
2. Increase Saturation by ~20
3. Decrease Brightness by ~10
4. Repeat for each additional darker step

**Hue shifting for extra polish (optional but recommended):**

- Blues and purples are naturally darker — shift hue toward blue to darken
- Yellows and reds are naturally lighter — shift hue toward yellow to lighten
- Shifting ~20 hue points in the right direction before applying S/B adjustments creates palettes that feel "alive" rather than flat

**For dark mode surface layering (depth without shadows):**

- Take your dark background color in HSB
- For each elevated surface (card, panel, modal), increase Brightness by 4–6 and decrease Saturation by 10–20
- Repeat per layer (bg → surface → elevated surface → tooltip)
- This creates natural-feeling depth on dark UIs where box-shadows become invisible

### 2.3 Approved Color Strategies

**Strategy A — Monochromatic + 1 accent**
Background: neutral gray/warm white → Text: dark → Accent: one vivid color (orange, electric blue, emerald, etc.)

**Strategy B — Dark + Neon**
Background: `#0D0D0D` → Text: `#E8E8E8` → Accent: `#00FF88` or `#FF3B5C` or `#4DFFFF`

**Strategy C — Earthy/Warm**
Background: `#FAF7F2` → Text: `#1A1A1A` → Accent: `#C84B31` or `#3D6B4F` or `#7B4F2E`

**Strategy D — High-contrast minimal**
Background: pure white → Text: pure black → Accent: single saturated color

### 2.3a Color Rules for Product/App UI (Dashboards, SaaS, Web Apps)

> These rules apply specifically to product UI — not marketing/landing pages. The 60-30-10 rule still applies but the palette needs more layers.

**Background layers — you need at least 4, not 1:**

| Layer          | Usage                           | Lightness (light mode)                           |
| -------------- | ------------------------------- | ------------------------------------------------ |
| Frame/sidebar  | App chrome, outermost container | Slightly darker than bg (add ~2% of brand color) |
| Background     | Main content area               | 97–100% white                                    |
| Card           | Elevated content surfaces       | Pure white OR slightly darker than bg            |
| Raised element | Modals, popovers, tooltips      | Lightest surface                                 |

- **Light mode is flexible:** dark sidebar + light cards (Vercel style) OR light bg + slightly darker cards (Notion style) OR monochromatic layers (Supabase style) — all work
- **Pure white IS acceptable** for product UI backgrounds — the key is that cards need to be distinguishable from the background, so don't use pure white for both
- Card borders: use `rgba(0,0,0,0.08)` — approximately 85% white — to define card edges without overpowering. **Never use a solid black border on cards in light mode.**

**Text hierarchy — lightness levels:**

| Text role       | Approximate lightness        | Usage                             |
| --------------- | ---------------------------- | --------------------------------- |
| Primary heading | ~89% black (11% white)       | Page titles, key labels           |
| Body text       | ~80–85% black (15–20% white) | Main readable content             |
| Subtext / muted | ~60–70% black (30–40% white) | Helper text, timestamps, metadata |

**Button darkness rule:** The more important a button is, the darker it is. Ghost → outlined → filled → solid black. Multi-purpose buttons sit around 90–95% white equivalents.

**Accent color as a scale, not a single color:**

- Don't define your accent as one hex value — define it as a scale from 100 (lightest) to 900 (darkest)
- Use the **500 or 600** as your main/default color
- Hover state: step up to **700**
- Links: use **400 or 500**
- Tinted backgrounds (e.g. info banners): use **100 or 200**
- Generate the full ramp at `uicolors.app`

**Dark mode — stricter rules than light mode:**

- Dark colors look more similar than light colors — they need more distance to appear distinct
- **Double the color distance:** light mode uses ~2% steps between surfaces; dark mode needs **4–6% steps**
- Surfaces always get **lighter** as they elevate — never darker. Cards are lighter than background. Modals are lighter than cards.
- For the accent color on dark mode: use the **300 or 400** from your ramp (lighter) as the primary, with hover at **400 or 500**
- Dim text colors and brighten borders compared to light mode equivalents

### 2.3b Semantic Colors — Non-Negotiable

These override your brand color system. Never use brand colors for these roles.

| Meaning             | Color               | Never substitute                          |
| ------------------- | ------------------- | ----------------------------------------- |
| Success / positive  | Green               | Brand color instead of green              |
| Error / destructive | Red                 | Any other color for delete/danger actions |
| Warning             | Yellow/amber        | Red (confuses with error)                 |
| Info / neutral      | Blue                | Brand color if it's not blue              |
| In progress         | Blue or brand color | —                                         |

- **Making destructive actions anything other than red is a design sin** — even if your entire brand is purple
- These colors must be present even in fully neutral/monochromatic products (e.g. Vercel uses black/white brand but still uses red/green for build status)

### 2.3c Charts & Data Visualization Color

Static KPI numbers → micro charts whenever possible (covered in Section 8.5). When you need multi-color charts:

- A single brand-color ramp for charts looks too similar between values — users can't distinguish data series
- A neutral/gray chart communicates nothing
- Use **OKLCH color space** for chart palettes — it normalizes perceived brightness across hues so green doesn't look more "neon" than blue at the same saturation
- Increment hue by ~25–30° steps across the spectrum to get chart colors at equal perceived brightness
- Use `oklch.com` to build chart palettes

### 2.4 Color DON'Ts

❌ Never use more than 5 colors in a UI  
❌ Never use generic purple-to-blue gradients (overused AI aesthetic)  
❌ Never use fully saturated colors for backgrounds (`#FF0000` bg = eye pain)  
❌ Never place low-contrast text on colored backgrounds (check WCAG AA: 4.5:1 ratio minimum — 3:1 for large text 24px+)  
❌ Never use rainbow / multi-color gradients for UI chrome  
❌ Never use different shades of the same color as "two different colors" — it reads as one

### 2.4a Use Opacity to Extend a Palette (Instead of Adding New Colors)

Rather than introducing a new color for every variation, use opacity on your existing palette colors.

- Take your primary/accent color and apply it at different opacities (10%, 20%, 40%) for backgrounds, tints, hover states, and decorative fills
- One good color used at multiple opacities beats five random colors
- This is how Google Material Design and Apple's design systems create rich palettes from a small set of base colors
- Keeps the design cohesive — every tint still reads as part of the same color family

### 2.5 Gradients

- Use gradients sparingly — only for hero sections, CTAs, or decorative elements
- Gradients should flow between **related hues** (20–40° apart on color wheel)
- For dark UIs: use **radial glows** as subtle accents, not full-background gradients
- Always ensure text placed over gradients is legible

### 2.6 Brand Cohesion — The Foundation of Premium

Logo + color palette + fonts must work as a unified system. Each element alone is not enough — they must feel like they belong together.

- **Logo:** Must look intentional and professional — not something generated in 2 minutes. Complexity doesn't matter; intention does.
- **Color palette:** Colors must complement each other and create a consistent mood across the entire site. Five colors that each look fine individually but clash together = amateur. Test every color combination in context, not in isolation.
- **Fonts:** Wrong font choice will make even a well-structured site feel cheap. Right fonts make a site feel more sophisticated than the brand even is. This is the highest-leverage typographic decision.
- When all three (logo, palette, fonts) are cohesive, the site feels like someone cared about the details — and _that_ is what premium means.

❌ Picking colors you like individually without checking how they work together
❌ Using a font because it's free or familiar, not because it fits the brand tone

---

## SECTION 3 — SPACING & LAYOUT

### 3.1 The 8pt Grid (NON-NEGOTIABLE)

Every spacing value must be a **multiple of 8px**:
`4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128...`

Never use arbitrary values like 13px, 22px, 37px.

**Spacing scale to use:**
| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Icon padding, tiny gaps |
| space-2 | 8px | Inline gaps, tight items |
| space-3 | 12px | Input padding, compact UI |
| space-4 | 16px | Default padding, card inner |
| space-5 | 24px | Section gaps, form rows |
| space-6 | 32px | Component separation |
| space-7 | 48px | Section breathing room |
| space-8 | 64px | Major section breaks |
| space-9 | 96–128px | Hero/page-level whitespace |

### 3.2 Layout Principles

- Use a **max-width container**: `1200px` for marketing, `960px` for apps, `720px` for reading/docs
- Always center the main container with `margin: 0 auto`
- Use **CSS Grid** for page layout, **Flexbox** for component layout
- Maintain consistent **horizontal padding**: at minimum `24px` on desktop, `16px` on mobile

### 3.2a Column Grid System

Use a column grid as the structural foundation of every layout — not freeform dragging until it "looks right."

| Device  | Columns    |
| ------- | ---------- |
| Desktop | 12 columns |
| Tablet  | 8 columns  |
| Mobile  | 4 columns  |

- 12 columns is flexible: divide into 2×6, 3×4, 4×3, or asymmetric splits like 8+4 or 7+5
- Content elements should span a consistent number of columns — never arbitrary widths
- Breaking the grid intentionally (for a hero image, a pull quote, a decorative element) reads as bold; breaking it accidentally reads as careless

### 3.3 Whitespace — The Secret Weapon

- When in doubt, **add more whitespace**. Cramped = cheap. Airy = premium.
- Section vertical padding: minimum `64px` top and bottom
- Between headline and body text: `16–24px`
- Between cards in a grid: `24–32px` gap
- Never let two major elements "touch" — always at least `16px` between them

### 3.4 Alignment

- Pick ONE alignment per text block. Don't mix.
- Left-align body text (always).
- Center-align: acceptable for short headlines, hero text, and CTA sections only.
- Right-align: only for numbers in tables, or secondary labels.
- Never justify text in UI — ragged right is more readable on screen.

### 3.5 Visual Hierarchy via Layout

Bigger → more important. Higher on page → more important. More whitespace around it → more important.

- The most important element on any screen should be visually unmistakable.
- Use size contrast aggressively: `12px` label next to a `48px` headline creates drama.

### 3.5a Focal Point — Every Layout Needs One

Every screen must have a single dominant element that the eye is drawn to first. Without it, the user doesn't know where to start and scans randomly.

- The focal point is the **center of interest** — not necessarily the center of the layout
- Placing the focal point slightly off-center (rule of thirds) creates a more interesting, dynamic composition than dead-center placement
- **Rule of thirds:** mentally divide the layout into a 3×3 grid; place the focal element at one of the four intersection points — this is more engaging than centering
- In a hero section: the focal point is either the headline or a hero image — never both competing equally
- Supporting elements should have clearly less visual weight than the focal point
- If a user lands on your page and can't identify the focal point within 2 seconds, the layout is broken

### 3.5b Overlapping Elements for Depth

Flat layouts where every element sits on its own layer look static. Overlapping creates depth, professionalism, and visual interest.

- Intentionally overlap a foreground element onto a background element (e.g. a card overlapping a section background, an illustration breaking out of its container)
- Overlapping adds contrast — especially useful when a section is too flat or monochromatic
- A headline partially overlapped by an illustration signals design craft
- The overlapped element must still be fully legible — depth without clarity is decoration, not design
- Even a small amount of overlap (10–20px) reads as intentional; none reads as unfinished

### 3.5c Color Flow — Guiding the Eye Through a Page

The order and placement of color on a page is itself a layout decision. Use it to direct attention top to bottom.

- Use your most bold, eye-catching color for the most important element (primary headline, hero CTA)
- As the user moves down the page, shift to softer, less saturated tones — this naturally pulls the eye downward
- Place a high-contrast accent color (CTA button) at the point where you want the user to take action — the contrast creates a visual "landing point"
- Color transitions between sections should feel gradual and intentional, not jarring
- This technique works in tandem with size hierarchy and whitespace — all three together create a clear visual pathway

### 3.5d Symmetric vs Asymmetric Balance

Both are valid — the choice depends on the tone of the design.

- **Symmetric balance** (centered or mirrored elements): creates stability, formality, trust — good for institutions, professional services, high-end brands
- **Asymmetric balance** (different sizes/weights on either side): creates energy, modernity, movement — good for startups, creative products, consumer apps
- Asymmetric layouts need more care — elements of different visual weights must still feel balanced overall
- Neither is better; the wrong choice for the context is worse than a technically imperfect execution of the right one

### 3.5e Section Alternating Backgrounds

Long single-page layouts (landing pages, marketing sites) where every section shares the same background color blur together on scroll. Users lose their sense of position.

- Alternate sections between `--color-bg` and `--color-surface` to create visual rhythm and clear section separation
- Example pattern: Hero (bg) → Logo bar (surface) → Features (bg) → Pricing (surface) → Testimonials (bg) → Final CTA (dark inversion)
- The alternation doesn't need to be strict — use it where it helps separate distinct content areas
- A dark-inverted final CTA section (full dark bg with light text) creates a strong visual terminus that signals "end of page, time to act"
- ❌ All sections same color = the page feels like one undifferentiated wall of content

### 3.6 Page Structure & User Journey

**People don't read websites — they scan.** Your layout must guide scanners from most important to least important without requiring them to read everything.

**Every page must have:**

- A **single goal** — one page, one desired action. Buy, sign up, or get a lead magnet. Not all three.
- An obvious next step (where does the user go from here?)
- A visible, easy-to-find CTA — never buried in the footer

**CTA placement cadence:**

- CTA in the **hero section** (above the fold)
- CTA in the **navigation**
- CTA repeated **every 2–3 scroll sections** as the user moves down the page
- Never make a user scroll back up to find the action button

**Trust signals — place them near every conversion point:**

- Testimonials/social proof must appear **both** near the pricing section AND before the final CTA — not just at the bottom
- A user hitting the pricing cards without adjacent social proof has no reassurance at the moment of decision
- ❌ Testimonials only at the bottom of the page = too late for most users

**Hero section must include a product visual:**

- ❌ Text-only heroes don't convert — there's nothing to see, nothing to feel
- Include a product screenshot, a skewed/composed UI mockup, or a visual that shows what the product actually does
- Even a simple browser frame with a screenshot, slightly rotated or elevated with shadow, immediately signals "this is real software"
- The visual should appear **below the CTAs** or **beside the headline** — never replacing readable content

**Logo bars (social proof strips):**

- ❌ Never use generic Lucide/icon library icons as stand-ins for company logos — `hexagon` ≠ Vercel, `triangle` ≠ Linear
- Use real SVG wordmarks, or text-only company names — text alone is more honest than a wrong icon
- **Text-only logo bar contrast rules (STRICT):**
  - Light background: use `rgba(0,0,0,0.45)` minimum — never go below this. `rgba(0,0,0,0.25)` is invisible.
  - Dark background: use `rgba(255,255,255,0.45)` minimum
  - Always verify contrast ratio is at least **3:1** against the section background
  - "Muted" means intentionally de-emphasized, not unreadable — the names must be legible at normal reading distance
- If you can't get real SVG logos, the text-only approach is: `font-weight: 600`, `font-size: 15–16px`, `opacity: 0.45–0.55` on light bg
- A logo bar that users can't read destroys the credibility it was supposed to build — invisible social proof is no social proof

**Information flow:**

- Pages must flow into each other logically — a visitor should always know what the next step is
- If someone lands on your homepage and can't immediately tell what to do next, the structure is broken
- A confused visitor always leaves. Confusion is never neutral — it costs conversions
- Use visual cues (size, color, directional elements, arrows, lines) to connect related content and indicate reading order

---

## SECTION 4 — COMPONENTS & UI ELEMENTS

### 4.1 Buttons

**Primary button:**

- Solid background (accent color), white or dark text, `border-radius: 6–12px`
- Padding: `12px 24px` minimum
- Font: medium weight (500–600), same size as body or slightly smaller
- Must have clear `:hover` state (darken/lighten by 10–15%)
- Must have `:active` state (scale down slightly: `transform: scale(0.97)`)

**Secondary button:**

- Outlined (1–2px border, accent color), transparent background
- Same sizing as primary

**Ghost/text button:**

- No border, no background. Just text + hover underline or color change.

❌ Never use more than 2 button variants on one page  
❌ Never make buttons full-width unless it's a mobile CTA — **exception: buttons inside narrow card containers (pricing cards, feature cards, modals) may be full-width** since the card constrains the width  
❌ Never use drop shadows on flat-style buttons

### 4.2 Cards

- Background: `--color-surface` (slightly elevated from page bg)
- Border: `1px solid --color-border` OR subtle box-shadow (not both)
- Border radius: `12–16px` for modern feel, `4–8px` for utilitarian
- Padding: minimum `24px`
- On hover: lift effect — `box-shadow: 0 8px 32px rgba(0,0,0,0.12)` + `transform: translateY(-2px)`
- Transition: `all 0.2s ease`

**Equal height cards in a grid (MANDATORY):**
Cards in the same grid row must be equal height regardless of content length. Without this, cards with more content grow taller and destroy visual alignment.

```css
/* Always use this pattern for card grids */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch; /* NOT start or center */
}

.card {
  display: flex;
  flex-direction: column;
}

/* Push the CTA/button to the bottom of every card */
.card .btn,
.card .card-action {
  margin-top: auto;
}
```

This is especially critical for **pricing cards** — if one tier has 5 features and another has 4, the cards will be unequal height and the grid looks broken. Always `flex-direction: column` + `margin-top: auto` on the button.

### 4.2a Card Content Hierarchy (IMPORTANT)

Don't just stack all data fields in a list — think about grouping and ranking:

1. **Remove redundant labels** — if the UI makes the data's meaning obvious, the label is clutter
2. **Group related items** — name + location go together; price + rating go together; metadata details go together
3. **Rank by importance** — put what users need first (name, price) at the top; put low-priority info (fine print, secondary actions) at the bottom
4. **Stack high-priority pairs** — e.g. name above location, price next to rating
5. **Use icons instead of text labels** for detail rows when the icon is universally understood
6. **Single row for detail metadata** — specs, stats, and attributes work well in one horizontal row with icons

❌ Don't list everything with equal visual weight — it forces the user to scan every line to find what they need

### 4.6 Dividers & Separators

- **Prefer whitespace over lines** — space items far enough apart that they're clearly separate without needing a border
- Lines are often redundant and add visual clutter
- If items must be tightly spaced for layout reasons, use **alternating row backgrounds** (subtle) instead of lines between every row
- The fewer elements used to achieve separation, the cleaner the result
- Horizontal `<hr>` dividers between every section = lazy design — use section padding instead

### 4.3 Inputs & Forms

- Height: `44px` minimum (touch target)
- Border: `1px solid` neutral color, `2px solid` accent on focus
- Border radius: match button radius for consistency
- Placeholder: muted color (not the same as label)
- Label: always above the input, never inside (floating labels are fine but complex)
- Error state: red border + red helper text below. Never just red border alone.
- Success state: green border or checkmark icon

### 4.4 Icons

- Use ONE icon library consistently (Lucide, Phosphor, or Heroicons recommended)
- Size: `16px` inline, `20px` standalone, `24px` prominent UI, `32–48px` feature icons
- Icons should **reinforce** text — never replace text for critical actions
- Stroke width: match your font weight (thin font = thin icons, bold font = heavier icons)
- Never mix filled and outlined icon styles on the same page

### 4.5 Images & Media

- Always define aspect ratios for image containers (`aspect-ratio: 16/9`, etc.)
- Never let images stretch or distort — always `object-fit: cover`
- Add subtle rounding to images: `border-radius: 8–12px`
- If using images as backgrounds, overlay with semi-transparent color to maintain text legibility
- Image placeholder while loading: use same bg color + skeleton animation

### 4.7 Custom Graphics & Illustrations (What Separates Premium from Cheap)

Generic stock photos and free icon libraries signal low effort immediately. Custom or purposeful visuals signal intention.

**Rules:**

- Avoid generic stock photography — if you must use photos, use ones that feel editorial and specific, not posed/generic
- Never use mismatched free icon sets — pick one library and use it exclusively (Lucide, Phosphor, Heroicons)
- Custom graphics/illustrations must **match the brand tone** — an out-of-place graphic is worse than no graphic
- Graphics should serve a purpose: breaking up content, guiding the eye, making information easier to digest — not pure decoration
- Every visual element should feel like it _belongs_ — if you have to ask whether it fits, it doesn't

❌ A graphic that looks out of place is worse than no graphic at all

---

## SECTION 5 — VISUAL DETAILS THAT SEPARATE GOOD FROM GREAT

### 5.1 Shadows

Use shadows to communicate elevation (not decoration):

```css
/* Level 0 — flat */
box-shadow: none;

/* Level 1 — subtle lift (cards) */
box-shadow:
  0 1px 3px rgba(0, 0, 0, 0.08),
  0 2px 8px rgba(0, 0, 0, 0.06);

/* Level 2 — hover state / dropdown */
box-shadow:
  0 4px 16px rgba(0, 0, 0, 0.12),
  0 2px 4px rgba(0, 0, 0, 0.08);

/* Level 3 — modal / dialog */
box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
```

Rules:

- Use ONE shadow style per elevation level. Don't invent new ones.
- Dark mode: reduce shadow opacity significantly (shadows are barely visible on dark backgrounds — use borders instead)
- Never use colored shadows unless it's an intentional glow effect on dark UIs

### 5.2 Border Radius Consistency

Pick ONE radius scale and stick to it:

| Element                 | Radius                                    |
| ----------------------- | ----------------------------------------- |
| Buttons, inputs, badges | `8px`                                     |
| Cards, panels           | `12px`                                    |
| Modals, large surfaces  | `16px`                                    |
| Tooltips, chips         | `6px`                                     |
| Avatars                 | `50%` (circle) or `12px` (rounded square) |
| Full pill               | `9999px`                                  |

❌ Never mix sharp corners (0px) and heavily rounded corners (24px) in the same design unless intentionally contrasting.

### 5.2a Nested Corner Radius Formula (IMPORTANT)

When you have a rounded element **inside** another rounded element (e.g. an image inside a card, a button inside a panel), the inner radius must be smaller — not equal.

**Formula:** `inner radius = outer radius − gap between them`

Example: outer card is `border-radius: 30px`, gap between card edge and inner element is `10px` → inner element gets `border-radius: 20px`.

- If the inner element is more than the outer radius away from the edge, just visually estimate — the math breaks down at distance.
- **Exception:** pill shapes (`border-radius: 9999px`) — the distance is equal all the way around so no adjustment is needed.
- Equal radii on nested corners creates a visible inconsistency in the gap — the corners look "off" even if the rest of the design is perfect.

### 5.3 Borders & Dividers

- Use `1px solid` — never `2px` for dividers (too heavy)
- Color: extremely subtle — `rgba(0,0,0,0.08)` light mode, `rgba(255,255,255,0.08)` dark mode
- Use borders OR shadows to separate sections — not both
- Avoid using `<hr>` dividers everywhere — whitespace is usually a better separator

### 5.4 Micro-interactions & Transitions

ALL interactive elements MUST have transitions:

```css
/* Default for everything */
transition: all 0.15s ease;

/* Hover lift */
transform: translateY(-2px);

/* Active press */
transform: scale(0.97);

/* Focus ring (accessibility) */
outline: 2px solid var(--color-accent);
outline-offset: 2px;
```

❌ Never have abrupt state changes with zero transition on interactive UI
❌ Never use `transition: all 0.5s` — too slow for UI (0.1–0.25s is the sweet spot)

### 5.4a Animation Philosophy — Subtle and Purposeful

The goal of animation is to guide attention and make the site feel alive — not to impress or entertain.

**DO:**

- Fade elements in as the user scrolls into them — makes content feel progressive, not dumped all at once
- Buttons respond visibly on hover — confirms interactivity
- Section transitions move in a way that feels natural and directs the eye toward the next key element
- Keep animations subtle enough that users don't consciously notice them — they should _feel_ them

**DON'T:**

- ❌ Bouncing, spinning, or looping animations on content — overwhelming, not premium
- ❌ Animations that play on every element simultaneously — creates chaos, not delight
- ❌ Animations that delay access to content — never block reading
- ❌ More than one "hero" animation — pick one focal motion per section
- ❌ Animation for its own sake — every motion must have a reason (guide eye, confirm action, signal state change)

**The test:** If a user consciously notices an animation and thinks "cool animation," it's probably too much. If the site just _feels_ smooth and alive, it's right.

### 5.5 Loading & Empty States

- Every list/grid MUST have an empty state (illustration or message — never just blank space)
- Loading states: use skeleton screens (not spinners) for content that has a known shape
- Error states: red accent, clear message, actionable CTA (retry button)

---

## SECTION 6 — RESPONSIVE DESIGN

### 6.1 Breakpoints

```css
/* Mobile first */
/* base: 0–639px (mobile) */
@media (min-width: 640px) {
  /* sm: large phones */
}
@media (min-width: 768px) {
  /* md: tablets */
}
@media (min-width: 1024px) {
  /* lg: laptops */
}
@media (min-width: 1280px) {
  /* xl: desktops */
}
```

### 6.2 Mobile Rules

- Touch targets: minimum `44×44px` for anything tappable
- Font size: never below `16px` for body (prevents iOS auto-zoom)
- Navigation: hamburger menu or bottom tab bar — never a full desktop nav on mobile
- Cards: full-width on mobile, grid on desktop
- Padding: reduce by ~25% from desktop values, but never below `16px` horizontal

### 6.3 Grid Behavior

- 3–4 column desktop grid → 2 column tablet → 1 column mobile
- Use `auto-fit` with `minmax()` for fluid grids: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`

---

## SECTION 7 — THE PREMIUM FEEL CHECKLIST

Use this before shipping any design:

### Typography

- [ ] Two fonts max, paired intentionally
- [ ] Clear 3-level hierarchy (big headline → subheading → body)
- [ ] Heading letter-spacing is slightly negative
- [ ] Hero text (70px+) has explicit kerning applied (-0.02em to -0.04em)
- [ ] No random bold words

### Color

- [ ] Max 5 colors total (landing pages) / 4 bg layers + accent scale (product UI)
- [ ] One accent color only — defined as a full scale (100–900), not a single hex
- [ ] All text passes contrast check (4.5:1 body, 3:1 large text)
- [ ] Background is off-white (landing pages) or white with distinct card layer (product UI)
- [ ] Dark mode surfaces get lighter as they elevate — never darker
- [ ] Dark mode color steps are 4–6% apart (not 2% like light mode)
- [ ] Semantic colors in place: red=error, green=success, yellow=warning
- [ ] Chart colors use OKLCH-spaced hues — not brand ramp alone

### Spacing & Layout

- [ ] All values on 8pt grid
- [ ] Generous whitespace between sections (≥64px)
- [ ] Consistent internal padding on all cards/panels
- [ ] Layout uses column grid (12 desktop / 8 tablet / 4 mobile)
- [ ] Clear focal point on every screen — identifiable within 2 seconds
- [ ] Every page has a single goal
- [ ] Card grids use `align-items: stretch` + `margin-top: auto` on buttons
- [ ] Sections alternate between `--color-bg` and `--color-surface` for visual rhythm

### Components

- [ ] All buttons have hover + active states
- [ ] All inputs have focus states
- [ ] Consistent border radius throughout
- [ ] One icon library, consistent size — no emojis
- [ ] No generic icons standing in for real brand logos in logo bars
- [ ] No generic stock photos or mismatched icon sets
- [ ] Every graphic feels like it belongs to this specific design
- [ ] No gradient avatar circles with initials
- [ ] Secondary actions collapsed into ⋯ menus
- [ ] No dead UI elements (buttons/cards that do nothing)
- [ ] Google Fonts `<link>` tag present — no system font fallbacks

### Polish

- [ ] All interactive elements have transitions
- [ ] Images have defined aspect ratios
- [ ] Empty/loading/error states designed
- [ ] Mobile layout tested
- [ ] Animations are subtle — user feels them, doesn't consciously notice them
- [ ] No bouncing/spinning/looping animations on content

### Structure & Conversion

- [ ] Primary CTA in hero section, in nav, and every 2–3 scroll sections
- [ ] Hero includes a product visual (screenshot, mockup, or UI preview)
- [ ] Trust signals placed near **pricing section** AND near final CTA
- [ ] Logo bar uses real wordmarks or text-only — no icon stand-ins
- [ ] Logo bar text contrast ≥ 3:1 (minimum `rgba(0,0,0,0.45)` on light bg)
- [ ] Next step is obvious from every page
- [ ] No more than one primary CTA per section
- [ ] Charts use real data arrays — no decorative SVG squiggles

---

## SECTION 8 — AI-GENERATED UI: WHAT TO ALWAYS FIX

When using Cursor, Copilot, v0, or any AI to generate UI, expect these specific problems every time. Fix all of them before shipping.

### 7.1 Icons & Emojis

- ❌ **Never use emojis as UI icons** — they are not professional in any product UI context (rare exception: apps like Notion where it's a deliberate brand choice)
- ❌ **Never use gradient circles with letters as avatars** — AI loves this pattern; replace with a proper avatar component or account card
- ✅ Replace all emoji icons with a proper icon library: **Phosphor**, **Lucide**, or **Heroicons** — pick one and use it exclusively

### 7.2 Colors

- ❌ **Never let AI choose your color palette** — AI defaults to bright, high-saturation colors that don't work together
- Always override AI color choices with your defined CSS variables from Section 2
- Add information and color through **data visualizations and charts** — not through decorative buttons and colored icons

### 7.3 Layout

- ❌ **Never let AI choose your layout** — AI sets up logic well but is bad at complex layouts and card design
- This is where you spend the least time for the largest visual return — always review and redesign AI-generated layouts
- **Duplicate information is a layout smell** — if the same data appears in multiple places on a small screen, consolidate it
- Tighten sidebar/nav spacing — AI almost always makes navigation too spacious and verbose

### 7.4 Cards & Components

- Overcrowded cards: collapse secondary actions into a **⋯ triple-dot menu**
- Chip/tag overload: collapse multiple chips to just **icons with tooltips**
- Sparse modals/forms: if you have plenty of screen space, expand the form — don't leave a modal half empty
- Collapse advanced/secondary options by default — show them on demand
- Remove any UI element that doesn't do anything or lead anywhere — dead UI destroys trust

### 7.5 KPIs & Data

- ❌ AI repeats KPIs across multiple pages/sections — never show the same metric in more than one place
- Replace static KPI number cards with **micro charts** (sparklines, donut charts, trend lines) — same data, far more useful
- For analytics: use **maps with shaded regions**, comparison toggles, and contextual breakdowns — not just bar charts
- Two-column layouts with small donut charts are a reliable, high-quality pattern for usage/billing dashboards

**Sparklines MUST be generated from real data arrays — this is non-negotiable:**

❌ This is a fake chart (what AI generates by default):

```html
<svg><polyline points="0,40 20,35 40,30 60,32 80,20 100,15" /></svg>
```

It's a hardcoded decorative squiggle. It will always trend upward regardless of data. Never do this.

✅ This is a real sparkline — generated from an actual data array:

```javascript
function sparkline(data, width = 120, height = 40) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
}

// Usage — pass real data:
const data = [12400, 13100, 11800, 14200, 15600, 14800, 16200];
document.getElementById("chart").innerHTML = sparkline(data);
```

Every KPI sparkline must call a function like this with real numbers. If you don't have real data, use a realistic hardcoded array with actual variance — not a straight upward line.

### 7.6 Pricing Pages

- Aim for **3–4 plans maximum** — 5+ creates decision paralysis
- Hierarchy: **price is the most important element** — make it large. Plan name is least important — make it small
- Always show: what the user saves vs. the next plan down, and what they'd gain by upgrading to the next plan up
- Use the label "Enterprise" not "Business" for the highest tier if it implies serious scale
- Show active discounts explicitly — never make users calculate savings themselves
- **Equal height cards are non-negotiable** — use `align-items: stretch` on the grid and `margin-top: auto` on the button so all cards bottom-align regardless of feature list length

### 7.7 Landing Pages (SaaS Specific)

- Landing pages are about **presentation**, not complexity — a simple page presented beautifully converts better than a complex page presented poorly
- ❌ **Text-only heroes don't convert** — include a product screenshot, skewed UI mockup, or browser-framed preview below the CTAs. The hero void (giant empty space between CTAs and logo bar) signals an unfinished product.
- ❌ Generic icons on feature sections = weak. Use **actual screenshots of your product** instead — skewed, shadowed, or composed
- ❌ **Logo bars with wrong icons destroy credibility** — `hexagon` for Vercel and `triangle` for Linear is worse than no logo bar. Use real SVG wordmarks or plain text company names at low opacity.
- Even a simple product screenshot with a slight skew/transform instantly elevates a landing page above generic
- The standard of quality on SaaS landing pages is high — users subconsciously judge product quality by landing page quality

---

## SECTION 9 — COMMON MISTAKES TO AVOID (THE "CHEAP DESIGN" LIST)

1. **Too many fonts** — instantly looks unprofessional
2. **Inconsistent spacing** — random padding makes UI feel broken
3. **Low-contrast text** — dark gray on medium gray = unreadable
4. **Abusing gradients** — purple-pink-blue gradient everything = 2019 AI startup cliché
5. **Tiny click targets** — buttons under 36px height = unusable
6. **Walls of text** — no line breaks, no hierarchy, no breathing room
7. **Default browser styles** — unstyled `<select>`, `<input>`, default `<a>` colors
8. **Misaligned elements** — use a grid, nothing should "float" randomly
9. **Too many accent colors** — orange AND green AND blue AND red = carnival, not product
10. **Ignoring hover/focus states** — interactive elements that don't respond to interaction feel broken
11. **Full-width buttons on desktop** — looks like a mobile-only app
12. **Centered body text** — readable only in 2–3 line chunks, never for paragraphs
13. **Missing whitespace above the fold** — cramming everything = anxiety-inducing, not informative
14. **Dark overlay on images too transparent** — text on hero images becomes unreadable
15. **Using box-shadow AND border on the same card** — pick one elevation signal
16. **No kerning on large headlines** — hero text at 70px+ without letter-spacing looks disjointed even with a great font
17. **Equal border-radius on nested elements** — inner corners must be smaller than outer corners by the gap distance
18. **Pure black backgrounds** — `#000000` looks flat; use a very dark tinted near-black instead
19. **Lines between every list item** — use spacing instead; lines add clutter without adding clarity
20. **Flat same-color cards on dark mode** — dark UIs need HSB surface layering for depth, not shadows
21. **Generic stock photos** — signals low effort immediately; use editorial, specific imagery or none at all
22. **Mismatched graphics** — a graphic that looks out of place is worse than no graphic; every visual must match the brand tone
23. **Chaotic animations** — bouncing, spinning, looping animations on content feel overwhelming, not premium
24. **Buried CTA** — if the primary call to action requires scrolling to find, you've already lost most visitors
25. **Colors that work individually but clash together** — always test your palette as a system, never color by color in isolation
26. **Emojis as UI icons** — never in a product interface; use Phosphor, Lucide, or Heroicons
27. **AI-chosen colors** — always override; AI defaults to bright clashing palettes
28. **Duplicate information across pages** — same KPI showing up 3 times in a small app is a layout failure
29. **Dead UI elements** — buttons, cards, or links that don't do anything destroy trust immediately
30. **Five pricing tiers** — 3–4 maximum; more than that creates decision paralysis
31. **Plan name larger than price on pricing cards** — users care about cost, not what you named the tier
32. **Generic icons on landing page feature sections** — use actual product screenshots instead; skewed and composed
33. **Gradient avatar circles with initials** — classic AI pattern; replace with a proper account component
34. **No focal point** — if a user can't identify what to look at first within 2 seconds, the layout is broken
35. **Flat overlapping nothing** — every element sits on its own layer with no overlap; static and lifeless
36. **Same fonts as everyone else** — Inter + system fonts = design that blends in, not stands out; use fontshare.com or uncut.wtf
37. **Opacity ignored** — adding a new color for every variation instead of using opacity on the existing palette
38. **CTA appears only once** — users who aren't ready at the hero need another chance; repeat every 2–3 scroll sections
39. **No social proof near CTAs** — testimonials buried at the bottom don't reduce hesitation where it actually happens
40. **Black border on cards in light mode** — use rgba(0,0,0,0.08) instead; solid black borders are too heavy
41. **Accent color as single hex in product UI** — needs to be a full 100–900 scale; hover, links, and tints all need different steps
42. **Destructive actions not in red** — red for delete/danger is non-negotiable regardless of brand color
43. **Dark mode surfaces darker on elevation** — always lighter as they raise; darker = buried, not elevated
44. **Brand color ramp for charts** — values look too similar; use OKLCH-spaced hues for distinguishable data series
45. **Same color distance in dark mode as light mode** — dark mode needs 4–6% steps between surfaces, not 2%
46. **Missing Google Fonts `<link>` tag** — fonts silently fall back to Arial/Times and the entire design collapses
47. **Unequal card heights in pricing grid** — cards with different feature counts grow to different heights; always use `align-items: stretch` + `margin-top: auto` on the button
48. **Text-only hero on SaaS landing page** — no product visual = no proof the product exists; add a screenshot or mockup
49. **Generic icons as logo bar stand-ins** — `hexagon` ≠ Vercel; wrong icons destroy credibility; use real wordmarks or text-only
50. **All sections same background color** — no visual rhythm; alternate `--color-bg` and `--color-surface` between sections
51. **Decorative SVG sparklines with no data** — AI draws fake charts that always trend up; every chart must be generated from real data arrays
52. **Trust signals only at page bottom** — social proof must also appear adjacent to the pricing section, not just before the final CTA
53. **Logo bar text too low contrast** — `rgba(0,0,0,0.25)` on off-white is ~2:1 contrast, effectively invisible; minimum is `rgba(0,0,0,0.45)` which hits 3:1
54. **Serif/display font inside dashboard UI** — "Dashboard", "Recent Links", KPI numbers must use the body font at heavy weight; display fonts belong on landing pages only
55. **Hardcoded decorative sparklines** — a straight upward SVG squiggle is not a chart; every sparkline must be generated from a real data array with actual variance

---

## SECTION 10 — QUICK REFERENCE PROMPT TEMPLATES

Use these exact phrases with any AI:

**For a landing page:**

> "Build this landing page following my design rulebook. Use [font A] for headings and [font B] for body. Primary accent: [hex color]. Light/dark mode: [choice]. Apply 8pt grid spacing. Load fonts via Google Fonts `<link>` tag. Include a product visual in the hero section. Logo bar must use text-only company names at `rgba(0,0,0,0.45)` minimum opacity — never lower — no generic icon stand-ins."

**For a dashboard:**

> "Create a dashboard UI following my design rulebook. Dark theme. Use subtle surface cards with 1px borders, no heavy shadows. Sidebar navigation, 3-column content grid. Accent color: [hex]. Use [body font] for ALL text including page titles, section headers, and KPI numbers — never use a display or serif font inside the app UI. All sparkline charts must be generated from real data arrays using a `sparkline(data)` function — never hardcode decorative SVG points."

**For a component:**

> "Build this [component] following my design rulebook. Match these CSS variables: [paste your variables]. Ensure hover/focus states, 8pt grid spacing, and proper transitions."

**For a color palette:**

> "Generate a color system following my design rulebook's 60-30-10 rule. Strategy: [A/B/C/D from Section 2.3]. Return CSS custom properties for all 7 required roles."

---

_Rulebook compiled from: design fundamentals, typography principles, color theory, UI/UX best practices, and production design patterns. Version 1.8 — patched from dashboard test: landing page vs product UI font split (no serif/display in app chrome), sparklines replaced with real `sparkline(data)` function pattern with actual data arrays._
