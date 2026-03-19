# Component Standards
# Fed to Mistral during Phase 2 — plan_structure task

## Buttons
- Height: 40px
- Border-radius: 8px
- Font-weight: 600
- Font-size: 14px
- Padding: 10px 18px
- Transition: background-color 200ms ease, transform 100ms ease
- :hover: slightly lighter/darker shade
- :active: transform: scale(0.97)
- :focus-visible: box-shadow: 0 0 0 3px var(--accent-alpha)
- Primary: accent background, white text
- Secondary: transparent background, accent border, accent text
- Ghost: transparent background, no border, accent text

## Inputs
- Height: 40px
- Border-radius: 8px
- Border: 1px solid var(--border)
- Padding: 10px 14px
- Font-size: 14px
- :focus: border-color: var(--accent), box-shadow: 0 0 0 3px var(--accent-alpha)
- Never use outline for focus — always box-shadow
- Placeholder color: var(--text-tertiary)

## Cards
- Border-radius: 12px
- Border: 1px solid rgba(0,0,0,0.08) (light) or rgba(255,255,255,0.06) (dark)
- Padding: 24px
- Transition: transform 200ms ease, box-shadow 200ms ease
- :hover: transform: translateY(-2px), box-shadow: 0 8px 24px rgba(0,0,0,0.12)

## Modals
- Max-width: 520px
- Border-radius: 16px
- Padding: 32px
- Backdrop: rgba(0,0,0,0.5) with backdrop-filter: blur(4px)
- Entry animation: opacity 0→1, scale 0.95→1, duration 250ms
- Exit animation: opacity 1→0, scale 1→0.95, duration 200ms

## Badges / Tags
- Height: 22px
- Border-radius: 99px
- Font-size: 12px
- Font-weight: 500
- Padding: 2px 10px

## Dropdowns
- Border-radius: 8px
- Max-height: 320px (scrollable)
- Min-width: matches trigger element width
- Box-shadow: 0 8px 32px rgba(0,0,0,0.16)
- Entry: opacity 0→1, translateY(-4px)→translateY(0), 200ms

## Navigation
- Desktop: horizontal nav bar, height 64px
- Mobile: bottom tab bar or hamburger menu
- Active indicator: 2px bottom border or filled icon
- Nav links: font-weight 500, font-size 14px
