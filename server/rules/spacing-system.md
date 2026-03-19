# Spacing System
# 4px base unit — all spacing values MUST be multiples of 4

## Allowed Values
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

## NEVER Use
5px, 7px, 10px, 15px, 17px, 22px, 25px, 30px, 35px, 50px

## Component Padding
- Card: 24px
- Button: 10px vertical, 18px horizontal
- Input: 10px vertical, 14px horizontal
- Modal: 32px
- Page container: 32px desktop, 16px mobile
- Navbar: 16px vertical, 24px horizontal

## Gaps Between Elements
- Between cards: 20px
- Between form fields: 16px
- Between sections: 80px desktop, 48px mobile
- Between paragraphs: 16px
- Between heading and content: 12px
- Icon and text: 8px

## Margin Rules
- Section vertical margin: 80px desktop, 48px mobile
- Card margin-bottom in grid: 20px
- No negative margins unless absolutely necessary

## CSS Custom Properties
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 80px;
  --space-5xl: 96px;
}
```
