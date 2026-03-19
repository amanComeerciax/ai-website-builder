# Accessibility Rules
# Applied across all phases

## Color Contrast
- Body text: 4.5:1 minimum contrast ratio (WCAG AA)
- Large text (24px+ or 18.67px bold): 3:1 minimum
- Interactive element borders: 3:1 against background
- Never rely on color alone to convey meaning

## Focus States
- Every interactive element MUST have a visible focus state
- Use: box-shadow: 0 0 0 3px var(--accent-alpha-40)
- Never use outline: none without a replacement focus style
- Focus order must follow visual reading order (top→bottom, left→right)

## Keyboard Navigation
- Tab navigates through all interactive elements in logical order
- Enter activates buttons and links
- Escape closes modals, dropdowns, and popups
- Arrow keys navigate within menus and lists
- Space toggles checkboxes and buttons

## ARIA and Semantics
- Icon-only buttons: always add aria-label describing the action
- Decorative images: alt=""
- Meaningful images: alt describes what the image shows
- Navigation landmarks: use <nav>, <main>, <header>, <footer>
- Form inputs: every input needs a label (htmlFor+id or aria-label)
- Placeholder text is NOT an acceptable label replacement

## Motion and Animations
- All animations must respect prefers-reduced-motion:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- Never use auto-playing animations that can't be paused
- Scroll-triggered animations: fade-in only, no lateral movement
