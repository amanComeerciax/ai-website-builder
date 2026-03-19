# Prompt Parsing Rules
# Fed to Mistral during Phase 1 — parse_prompt task

## Classification
Classify every user prompt into one category:
- **new_site**: Building from scratch. Keywords: "build", "create", "make me", "I want", no existing context.
- **edit_existing**: Modifying current code. Keywords: "change", "fix", "update", "move", "replace".
- **add_feature**: Adding to current site. Keywords: "add", "include", "put", "insert".
- **style_change**: Visual-only change. Keywords: "make it", "color", "font", "darker", "bigger", "spacing".

## Vague Phrase Dictionary
When users say vague things, interpret them precisely:

| User says | Interpretation |
|-----------|---------------|
| "make it modern" | Clean sans-serif font, generous whitespace (32px+ gaps), subtle 1px borders, monochromatic palette, remove gradients |
| "make it pop" | Increase accent color saturation to 80%+, add contrast between sections, reduce competing visual elements |
| "make it dark" | Background #0f0f0f, surface #1a1a1a, text #e8e8e8, borders rgba(255,255,255,0.08) |
| "make it light" | Background #f8f8f6, surface #ffffff, text #1a1a1a, borders rgba(0,0,0,0.08) |
| "add animations" | Scroll-triggered fade-in reveals + button/card hover states only. No autoplay, no parallax |
| "make it minimal" | 2 colors max, increased whitespace (48px+ section gaps), remove decorative elements, reduce to essentials |
| "make it professional" | Dark navy/charcoal palette, serif heading font, conservative grid layout, muted accent |
| "make it fun" | Rounded corners 16px+, warm accent color (orange/coral), playful display font, emoji optional |
| "make it clean" | Same as "modern" — generous whitespace, consistent spacing, clear hierarchy |
| "make it responsive" | Already default. Acknowledge but don't change approach |

## Default Assumptions
Apply these when the user doesn't specify:
- Theme: light mode unless "dark" mentioned
- Layout: mobile-first, responsive by default
- Images: use placeholder.co URLs (e.g. https://placehold.co/600x400)
- Font: DM Sans for body, contextual display font for headings
- Accent: contextual to site type (bakery=warm brown, tech=blue, health=green)

## Clarification Rule
- **New site requests under 8 words**: Ask ONE clarifying question about purpose/audience
- **Edit requests**: NEVER ask — just do it
- **Detailed prompts (8+ words)**: NEVER ask — proceed with interpretation

## outputTrack Selection
This field controls which generation pipeline is used:
- **"html"**: Landing pages, portfolios, restaurant/bakery/coffee shop sites, blogs, simple one-pagers, any prompt under 15 words about a website or web page. DEFAULT IF NO FRAMEWORK IS SPECIFIED.
- **"react"**: Dashboards, SaaS apps, e-commerce with cart/auth, admin panels, apps with routing or login, OR IF THE USER EXPLICITLY ASKS FOR REACT, NEXT.JS, VITE, MERN, OR FULL STACK.

IMPORTANT: If the user explicitly asks for React, Vite, MERN, or full-stack, you MUST select "react". Otherwise, if unsure or for simple sites, ALWAYS default to "html" (it works instantly with zero build errors).

## Output Format
Always return valid JSON only. No markdown. No explanation. Shape:
```json
{
  "classification": "new_site|edit_existing|add_feature|style_change",
  "siteType": "string",
  "pageType": "landing|dashboard|portfolio|ecommerce|blog|docs",
  "outputTrack": "html|react",
  "vaguePhrases": [{"phrase": "string", "interpretation": "string"}],
  "assumptions": ["string"],
  "colorPreference": "light|dark|auto",
  "targetAudience": "string",
  "sections": ["hero", "features", "footer"]
}
```
