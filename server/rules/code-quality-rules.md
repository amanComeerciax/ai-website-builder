# Code Quality Rules
# Injected into Qwen for EVERY file generation call
# MUST stay under 800 tokens — Qwen reads this as system prompt

## HTML
- Use semantic elements: nav, main, section, article, header, footer
- One h1 per page. Headings must be sequential (h1→h2→h3)
- Every img needs alt attribute. Decorative: alt=""
- Every input needs a label (htmlFor+id or aria-label)
- Never use div when a semantic element fits

## CSS
- All colors as CSS custom properties in :root — no hardcoded hex in components
- No inline styles (style="" attributes)
- Dark backgrounds: #0f0f0f or #111111, never pure #000000
- All spacing values must be multiples of 4px
- Transitions: name specific properties, never transition: all
- Every button: add :active { transform: scale(0.97) }

## JavaScript/React
- No console.log() in output
- No TODO comments
- No lorem ipsum text
- Copyright year: new Date().getFullYear()
- Every component must have a default export
- Use proper ES6 imports at the top of every file
- No TypeScript syntax (no type annotations, no interfaces)
- Mock all data inline — no fetch calls, no API requests

## File Structure
- Always include src/App.jsx as the main entry component
- Include src/index.css or src/styles.css for global styles
- Component files in src/components/
- Use .jsx extension for React components, .css for styles
