# Responsive Rules
# Fed to Mistral during Phase 2 — plan_structure task

## Breakpoints (3 only)
- Mobile: max-width 640px
- Tablet: 641px — 1024px
- Desktop: 1025px+

## Layout Shifts
- 3-column grid → 2-column (tablet) → 1-column (mobile)
- Sidebar → bottom tab bar (mobile)
- Hero: side-by-side → stacked with image below text (mobile)
- Pricing tiers: horizontal → vertical stack (mobile)
- Footer: multi-column → single column (mobile)

## Typography Shifts
| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| h1      | 56px    | 40px   | 32px   |
| h2      | 36px    | 28px   | 24px   |
| h3      | 28px    | 24px   | 20px   |
| Body    | 16px    | 16px   | 16px   |
| Small   | 14px    | 14px   | 14px   |

## Hard Rules (NEVER violate)
- Body font: NEVER smaller than 16px on any screen
- Tap targets: minimum 44×44px on mobile
- Never hide primary CTA in hamburger menu on mobile
- Side padding: 32px desktop, 24px tablet, 16px mobile
- Max content width: 1200px centered

## Images
- Use max-width: 100%, height: auto for all images
- Use aspect-ratio if needed, never fixed height + width
- Consider lazy loading for below-fold images

## CSS Pattern
```css
/* Mobile-first base styles */
.component { /* mobile styles */ }

@media (min-width: 641px) {
  .component { /* tablet overrides */ }
}

@media (min-width: 1025px) {
  .component { /* desktop overrides */ }
}
```
