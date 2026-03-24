# StackForge AI — THEME & DESIGN SYSTEM (AI REFERENCE)

This document is the "source of truth" for the AI's visual identity. The AI refers to the rules in `server/rules/` to build every website.

## 1. Color System (Section 4)
The AI is instructed to always use CSS variables.
- **Background**: `--color-bg` (#f8f8f6 or #0f0f0f)
- **Surface**: `--color-surface` (#ffffff or #1a1a1a)
- **Accent**: `--color-accent` (Default: #2563eb)
- **Text**: `--color-text` (#111827 or #e8e8e8)

**Palettes available:** Light, Dark, Warm, Earthy, Luxury, Minimal, Vibrant.

## 2. Component Library (Section 9)
The AI has access to 11 "Ready-to-Use" premium components:
- **C00**: RevealOnScroll (Framer Motion)
- **C01**: Primary/Secondary Buttons
- **C02**: KbdShortcut
- **C03**: Toast Notifications
- **C04**: Avatar + Name Tag
- **C05**: Skeleton Loader
- **C06**: Tooltip (800ms delay)
- **C07**: HoverPreview
- **C08**: ProgressStepper
- **C09**: CardStack
- **C10**: SearchBar
- **C11**: UpgradeRow (Pro)

## 3. Typography (Section 3)
Approved font pairings (Google Fonts):
- **Modern**: Inter + Roboto
- **Elegant**: Playfair Display + Lora
- **Bold**: Archivo Black + Montserrat
- **Artisanal**: Fraunces + Outfit

## 4. Spacing (Section 8)
Strict 4px scale: `4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px`.

---
*To add a new theme: Edit `server/rules/section-4-color.md` to add a new palette, or add a new component to `section-9-components.md`.*
