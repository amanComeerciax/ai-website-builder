# Iteration Rules
# Fed to Mistral when user sends follow-up edits to an existing project

## Classify Edit Scope FIRST

Before touching any file, determine the scope:

### SCOPED (change ONLY the specified element)
- **Color change** → only edit CSS custom property values in :root
- **Font change** → only edit font-family in :root and Google Fonts link
- **Text content** → only edit the specific text node
- **Single component** → only that component's CSS and JSX
- **Hide/show element** → only toggle display/visibility on that element

### MEDIUM (2-3 files max)
- **Add a new section** → new component JSX + new CSS + update App.jsx imports
- **Add a feature** → new component + CSS + optional utility file
- **Change layout** → update grid/flex in the parent component + child spacing

### FULL REGENERATION (only when explicitly requested)
User must say one of these to trigger a full rebuild:
- "Redesign the whole thing"
- "Change the layout completely"
- "Start over"
- "Rebuild from scratch"

## Golden Rules

1. **Change EXACTLY what the user asked.** Never "improve" adjacent code.
2. **Preserve all existing functionality.** A color change should not break a nav menu.
3. **Keep import/export contracts stable.** If other files import from this file, don't rename exports.
4. **Prefer CSS-only changes** when the request is purely visual (colors, spacing, fonts, sizes).
5. **Never add new dependencies** unless the user specifically asks for a library.
6. **If unsure about scope:** default to SCOPED. Less change is always safer.

## Edit Response Format
Return only the files that changed. Shape:
```json
{
  "files": {
    "src/App.jsx": "full updated content...",
    "src/index.css": "full updated content..."
  },
  "filesChanged": ["src/App.jsx", "src/index.css"],
  "changeDescription": "Changed accent color from blue to purple"
}
```
