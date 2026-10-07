---
name: design-karir-bca-co-id
description: Design system extracted from Temukan Jalan Untuk Mewujudkan Karir I… (https://karir.bca.co.id/candidate/id/login). Use when building UI that should match this brand's visual identity.
triggers:
  - "Temukan Jalan Untuk Mewujudkan Karir I…"
  - "karir-bca-co-id"
  - "design like Temukan Jalan Untuk Mewujudkan Karir I…"
  - "Temukan Jalan Untuk Mewujudkan Karir I…風"
source: https://karir.bca.co.id/candidate/id/login
extractedAt: 2026-10-07T15:52:11.268Z
tags: ["light", "rounded", "accented", "monospace", "sans-serif"]
---
# Design System Inspired by Temukan Jalan Untuk Mewujudkan Karir I…

> Auto-extracted from `https://karir.bca.co.id/candidate/id/login` on 2026-10-07

## 1. Visual Theme & Atmosphere

Friendly, approachable design with rounded shapes and generous whitespace.

The hero section leads with "Masuk ke Akun" followed by "Lengkapi email dan kata sandi untuk masuk ke akun Anda".

**Key Characteristics:**
- opensans-bold as the heading font
- ui-sans-serif as the body font for all running text
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#005caa` used for CTAs and brand highlights
- 4 shadow level(s) detected — tinted shadows
- Rounded corners (48px+) creating a friendly, approachable feel
- Tags: light, rounded, accented, monospace, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#005caa`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#005cab`) · `--color-secondary`: Secondary brand, hover states, complementary highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#005caa`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#000000`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#666666`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#e5e5e5`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | block | large | text-dark |
| 2 | `#005caa` | `--palette-2` | text-accent | medium | text-light |

## 3. Typography Rules

- **Heading Font:** `Open Sans`, `opensans-bold`, sans-serif
- **Body Font:** `ui-sans-serif`, sans-serif

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H2 | opensans-bold | 30px | 700 | 48px | normal |
| H3 | opensans-semibold | 18px | 600 | 28px | normal |
| Body | opensans-regular | 14px | 400 | 20px | normal |
| Small | opensans-regular | 14px | 400 | 20px | normal |
| Code | ui-monospace | 14px | 400 | 20px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `30px` | headings |
| H1 | `18px` | headings |
| H2 | `16px` | headings |
| H3 | `14px` | headings |
| H4 | `12px` | headings |

## 4. Component Stylings

### Primary Button (Filled)

```css
.btn-filled-2 {
  background: #005caa;
  color: #ffffff;
  border-radius: 48px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border: 0.8px solid rgb(0, 92, 170);
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-filled-2:hover {
  background: #004b8d;
}
```

### Secondary Button (Filled Light)

```css
.btn-filled {
  background: #ffffff;
  color: #005caa;
  border-radius: 48px;
  padding: 8px 32px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #005caa;
  cursor: pointer;
}
```

### Card

```css
.card {
  background: #ffffff;
  border-radius: 24px;
  padding: 36px;
  border: 1px solid #e5e5e5;
  box-shadow: rgba(112, 144, 176, 0.1) 0px 0px 40px 8px;
}
```

## 5. Layout Principles

- **Base spacing unit:** `12px` — use multiples (12px, 24px, 36px, 48px, etc.)
- **Border Radius:** `48px` for buttons and capsules, `24px` for cards.
