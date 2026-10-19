---
name: LA GLACE Social Listening Report
description: Client-branded beauty report — editorial warmth on top of an evidence-first briefing.
colors:
  rose-primary: "#e8557a"
  rose-hot: "#fb6f92"
  rose-blush: "#f472b6"
  rose-pale: "#fbcfe8"
  rose-tint: "#fdf2f4"
  rose-wash: "#fff8fa"
  plum-night: "#1e131d"
  plum-wine: "#4f1d35"
  page-mist: "#faf7f9"
  surface-white: "#ffffff"
  ink-heading: "#0f172a"
  ink-body: "#1e293b"
  slate-muted: "#64748b"
  slate-faint: "#94a3b8"
  line-input: "#e2e8f0"
  line-divider: "#f1f5f9"
  line-rose: "rgba(232, 85, 122, 0.12)"
  sentiment-positive: "#10b981"
  sentiment-neutral: "#f59e0b"
  sentiment-negative: "#f43f5e"
  star-gold: "#f3a51b"
typography:
  display:
    fontFamily: "Prompt, Kanit, 'LINE Seed Sans TH', 'Noto Sans Thai', 'Leelawadee UI', sans-serif"
    fontSize: "clamp(30px, 3.8vw, 44px)"
    fontWeight: 750
    lineHeight: 1.28
    letterSpacing: "0"
  headline:
    fontFamily: "Prompt, Kanit, 'LINE Seed Sans TH', 'Noto Sans Thai', 'Leelawadee UI', sans-serif"
    fontSize: "22px"
    fontWeight: 750
    lineHeight: 1.42
  title:
    fontFamily: "Prompt, Kanit, 'LINE Seed Sans TH', 'Noto Sans Thai', 'Leelawadee UI', sans-serif"
    fontSize: "17px"
    fontWeight: 700
  body:
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Thai', 'IBM Plex Sans Thai', Sarabun, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
  body-small:
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Thai', 'IBM Plex Sans Thai', Sarabun, 'Segoe UI', sans-serif"
    fontSize: "13.5px"
    fontWeight: 330
    lineHeight: 1.85
  label:
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Thai', 'IBM Plex Sans Thai', Sarabun, 'Segoe UI', sans-serif"
    fontSize: "12.5px"
    fontWeight: 550
  eyebrow:
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Thai', 'IBM Plex Sans Thai', Sarabun, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 650
    letterSpacing: "0.04em"
  metric:
    fontFamily: "Prompt, Kanit, 'LINE Seed Sans TH', 'Noto Sans Thai', 'Leelawadee UI', sans-serif"
    fontSize: "32px"
    fontWeight: 750
    lineHeight: 1.15
    fontFeature: "'tnum'"
  metric-hero:
    fontFamily: "Prompt, Kanit, 'LINE Seed Sans TH', 'Noto Sans Thai', 'Leelawadee UI', sans-serif"
    fontSize: "clamp(52px, 5.5vw, 68px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
rounded:
  badge: "6px"
  input: "12px"
  quote: "14px"
  metric: "16px"
  card: "18px"
  panel: "20px"
  hero: "24px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "36px"
  section: "44px"
components:
  button-primary:
    backgroundColor: "{colors.rose-primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "11px 18px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.rose-primary}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "34px"
  tab:
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  tab-active:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.rose-primary}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  chip-active:
    backgroundColor: "{colors.rose-primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  input-search:
    backgroundColor: "{colors.line-divider}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.input}"
    height: "42px"
    padding: "0 14px 0 40px"
  card-metric:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-heading}"
    rounded: "{rounded.metric}"
    padding: "22px 20px"
  card-section:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.card}"
    padding: "24px"
  hero:
    backgroundColor: "{colors.plum-night}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.hero}"
---

# Design System: LA GLACE Social Listening Report

> Recorded from the shipped code on 2026-10-19 (`app/globals.css`, winning rules in the final "overview refinement" block ≈ lines 5834–7827 plus the quality block ≈ 7828–8116). This documents the **LA GLACE theme as it renders today**. It is the first client theme; a client-neutral base is not yet separated out. Items marked **Drift** are inconsistencies in the current code, not rules to copy.

## Overview

**Creative North Star: "The Beauty Briefing"**

A beauty-editorial skin on an executive briefing. The report opens on a dark plum hero with a rose glow and a glass sentiment panel — the one dramatic moment — then settles into a calm, pale-mist page of white cards where numbers, charts and real customer quotes do the talking. The brand's rose carries emphasis and action; slate neutrals carry reading.

Density is moderate for desktop reading: a 1240px container, generous section spacing (44px), 16–24px card padding, and small-but-legible labels. Everything round is soft: 18px cards, pill-shaped tabs, chips and buttons. Depth comes from faint rose-tinted shadows, never from heavy borders.

The client's brand leads. Our presence shows in the rigor of the evidence (period, sample, sources, quotes), not in our own logo or colours.

**Key Characteristics:**
- One dark, glowing plum hero per page; everything below is light.
- Rose (`rose-primary` / `rose-hot`) for action, active state and highlights only.
- Slate neutrals for text and lines; white cards on a pale mist page.
- Pills for every interactive control; 16–18px corners for containers.
- Rose-tinted, low-opacity shadows; hover lifts by 1–2px.
- Tabular numbers for every metric.

## Colors

Rose-on-mist with a plum night hero; slate does the reading, rose does the pointing.

### Primary
- **Glace Rose** (`rose-primary`): links, active tab text, eyebrows, icon accents, the solid end of every CTA gradient.
- **Hot Rose** (`rose-hot`): the bright start of the CTA gradient (`135deg, rose-hot → rose-primary`), input focus border, quote accent rule (4px left border).
- **Blush Bar** (`rose-blush`): start of horizontal data-bar gradients (`90deg, rose-blush → rose-primary`).
- **Petal on Night** (`rose-pale`): kicker and accent text on the dark hero **only**.
- **Rose Tint** (`rose-tint`) and **Rose Wash** (`rose-wash`): pill backgrounds and table/list row hover.

### Secondary
- **Plum Night** (`plum-night`) → **Plum Wine** (`plum-wine`): the hero gradient (`135deg, #1e131d 0%, #341825 48%, #4f1d35 100%`) with rose radial glows. White text on top.

### Neutral
- **Page Mist** (`page-mist`): page base under three faint rose radial glows.
- **Surface White** (`surface-white`): every card, table, input-on-focus, secondary button.
- **Heading Ink** (`ink-heading`): headings and big numbers. **Body Ink** (`ink-body`): running text.
- **Slate Muted** (`slate-muted`): descriptions, labels, inactive tabs. **Slate Faint** (`slate-faint`): tertiary meta.
- **Input Line** (`line-input`), **Divider** (`line-divider`): input borders and in-card row dividers. **Rose Line** (`line-rose`, 12–16% alpha): card and panel borders.

### Sentiment
- **Positive** (`sentiment-positive`), **Neutral** (`sentiment-neutral`), **Negative** (`sentiment-negative`): the hero sentiment stack, legend and timeline bars. Badges use darker text on a pale fill of the same hue.
- **Star Gold** (`star-gold`): rating stars. The 5→1 star bar runs green → light green → amber → orange → rose.

### Named Rules
**The Rose Means Action Rule.** Rose marks what you can click, what is active, or what to look at first. Never use brand rose to encode sentiment.

**The One Night Rule.** Only the hero is dark. Pale accents such as `rose-pale` are for that dark surface and nowhere else.

**Drift (to resolve):**
- Sentiment colours conflict across pages:
  - The product-quality chart and engagement donut use rose for *negative*.
  - The summary page uses rose for *positive*.
  - The data table shows neutral as grey.
  - Five different greens are used for positive.
  - The overview mapping above is the documented intent.
- Two neutral families are mixed: slate on the overview and quality pages, plum-grey (`#302431`, `#7d6b78`…) on engagement, summary, backoffice and the modal. There are also about 10 near-duplicate deep pinks.
- Product-quality source links are blue (`#2563eb`).
- No colour is a CSS custom property. The `--lg-*` variables exist but are almost unused; values are hardcoded hex.

## Typography

**Display Font:** Prompt (falls back through Kanit, LINE Seed Sans TH, Noto Sans Thai, Leelawadee UI)
**Body Font:** Plus Jakarta Sans (falls back through Noto Sans Thai, IBM Plex Sans Thai, Sarabun, Segoe UI)

**Character:** A rounded Thai display face for headings and numbers, a clean geometric sans for reading. In practice **no web font is loaded** (no `next/font`, `@font-face` or font link). Readers see their system's Thai font, e.g. Leelawadee UI / Segoe UI on Windows. Non-standard weights (330, 550, 650, 750) snap to 400/700 there.

### Hierarchy
- **Display** (750, `clamp(30px, 3.8vw, 44px)`, 1.28): hero headline on the dark plum hero.
- **Headline** (750, 22px, 1.42): section headings (`.lg-editorial-head h2`).
- **Title** (700, 17px): card and chart headings.
- **Body** (400, 15px, 1.75): base text. Hero lede is 15px / 1.8 at 88% white.
- **Body Small** (330, 13.5px, 1.85): section descriptions. Table cells and mention text are 13px.
- **Label** (550, 12.5px): metric labels, table headers (650).
- **Eyebrow** (650, 12px, 0.04em, uppercase, rose): section kickers.
- **Metric** (750, 32px, 1.15, tabular): KPI cards. **Metric Hero** (800, `clamp(52px, 5.5vw, 68px)`): sentiment panel score.

### Named Rules
**The Tabular Numbers Rule.** Every count, percentage and score uses tabular figures so columns of numbers align.

**Drift (to resolve):**
- Up to four font stacks render on one page: Plus Jakarta body, Prompt headings and controls, Noto Sans Thai on the quality page, and Segoe UI on product card titles.
- Hero h1 sizes and weights differ per page: overview 44px max / 750, quality 58px, summary 62px, backoffice 58px / 640.
- Eyebrows vary between 11px and 12px, and between weight 650 and 900.

## Layout

- **Container:** `min(1240px, 100% - 32px)` (≤640: `100% - 22px`). Summary sheet `min(1120px, 100% - 48px)`.
- **Vertical rhythm:**
  - Main padding is 36px on top and 60px at the bottom.
  - Sections are spaced by `spacing.section` (44px); the evidence stream gets 48px.
  - Two-column and quote blocks get 36px; the footer gets 54px.
- **Grids:**
  - Hero: `1.25fr / minmax(360px, .75fr)`, gap 40px.
  - KPI row: 4 columns, gap 16px. Wide metrics: 2 columns.
  - Timeline: `1.8fr / minmax(320px, .82fr)`, gap 24px. Two-column articles: gap 24px.
  - Quality: KPI 4 columns, products 3 columns.
- **Gaps:** mostly 8 / 10 / 12 / 14 / 16px inside components; 24px between cards.
- **Breakpoints:** desktop-first `max-width` only. The working steps are ≈1100 → 900 → 768 → 700 → 560/640, but there is no single scale.
- **Print:**
  - A4 with 12mm margins; summary page only (`/reports/[slug]/summary?print=1` auto-prints).
  - Sections avoid page breaks inside; colours print exactly.
  - Overview and quality pages have no print styles.

**Drift / risks:**
- The data table has a 1240px minimum width and scrolls horizontally on small screens.
- The sticky top bar stacks into a tall column at ≤640px.
- Tabs never collapse or wrap.
- Many labels are 10–11px.

## Elevation & Depth

Soft lift with tinted light: surfaces are white cards on a mist page, separated by a 1px rose line and a faint rose-tinted shadow. Hover raises interactive cards 1–2px and deepens the shadow. Glass (backdrop blur 16–18px) appears on the sticky top bar, the hero sentiment panel and some cards.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 4px 20px -4px rgba(232, 85, 122, 0.05)`): section cards, tables, panels.
- **Metric rest → hover** (`0 2px 12px -2px rgba(232,85,122,.04)` → `0 8px 24px -4px rgba(232,85,122,.1)` + `translateY(-2px)`): KPI cards.
- **CTA** (`0 4px 16px rgba(232,85,122,.35)` → hover `0 6px 20px rgba(232,85,122,.45)`): primary gradient buttons.
- **Active chip** (`0 2px 8px rgba(232,85,122,.25)`).
- **Hero** (`0 20px 50px -10px rgba(35,12,24,.32), 0 1px 3px rgba(0,0,0,.2)`).
- **Modal** (`0 24px 70px rgba(50,26,43,.24)`) over a `rgba(28,20,31,.46)` backdrop.

### Named Rules
**The Tinted Shadow Rule.** Shadows are rose-tinted and low-opacity (≤ .1 at rest); only the hero and modal use dark shadows.

**Drift:** blur is applied to many cards, which is costly on low-end phones. Engagement and backoffice cards still carry an older heavy glass shadow (`0 24px 70px rgba(232,85,122,.09)`).

## Shapes

Soft and rounded throughout. Interactive controls are pills (`rounded.pill`). Containers step up in radius with their importance:

| Element | Token | Radius |
|---|---|---|
| Badges | `rounded.badge` | 6px |
| Inputs | `rounded.input` | 12px |
| Quotes | `rounded.quote` | 14px |
| Metric cards | `rounded.metric` | 16px |
| Section cards | `rounded.card` | 18px |
| Sentiment panel | `rounded.panel` | 20px |
| Hero, modal | `rounded.hero` | 24px |

Product images sit in 16px rounded tiles with a pale rose gradient.

**Drift:**
- The Export link and back link use 12px corners next to pill siblings.
- Engagement cards use 24px against 18px elsewhere.
- The quality-page select uses 9px.

## Components

### Buttons
- **Shape:** pill (999px).
- **Primary (`.lg-primary-link`):**
  - Fill: CTA gradient `135deg, rose-hot → rose-primary`, white 13.5px / 650, padding 11px 18px.
  - Rest: CTA shadow.
  - Hover: lifts 1px, shadow deepens; transitions transform and box-shadow over .18s ease.
- **Secondary (`.lg-report-actions button`, footer links):**
  - Fill: white, rose text 12.5–13px / 600–650, 1px rose border at 20–25% alpha. Minimum height 34px (top bar) or 42px (footer).
  - Hover: rose wash background (8% alpha).

### Chips
- **Filter chip (platform filters):**
  - Rest: white, `line-input` border, slate-muted 12px / 550, padding 6px 13px.
  - Hover: border `#cbd5e1`, ink text.
  - Active: CTA gradient, white text, weight 650, active-chip shadow.
- **Topic chip:** `#fff7fa` fill, `#9f4764` text, 11px pill.
- **Sentiment badge:** darker hue text on a pale fill of the same hue with a light border (e.g. positive `#059669` on `#ecfdf5`). Platform badges use 6px corners.

### Cards / Containers
- **Corner Style:** 18px for sections, 16px for metrics.
- **Background:** white on page mist.
- **Shadow Strategy:** Card rest, with Metric hover lift (see Elevation & Depth).
- **Border:** 1px `line-rose`.
- **Internal Padding:** 20–24px.
- **Row hover:** `rose-wash`.

### Inputs / Fields
- **Search:**
  - Shape: 42px tall, 12px corners, `line-input` border, `#f8fafc` fill, 40px left padding for the icon, 13.5px text.
  - Focus: `rose-hot` border, white fill, 3px ring `rgba(251,111,146,.15)`.
  - Selects match the search field.
- **Drift:**
  - The global keyboard focus ring is still the old blue (`3px solid #3458db`).
  - Many fields remove the outline and rely on the pink `:focus` ring only.

### Navigation
- **Top bar:** sticky, white at 90% with 16px blur, 1px rose line below, 64px tall.
- **Brand mark:** 38px rose-gradient tile with initials, the brand name in Heading Ink 16px / 750, and an 11px uppercase rose subtitle.
- **Report tabs:**
  - Track: a pill on pale slate.
  - Tabs: slate-muted 13px / 550, padding 6px 14px.
  - Hover: rose text on 8% rose.
  - Active: white pill, rose 650 text, inset rose hairline.

### Hero with Sentiment Panel (signature)
- **Hero:** the dark plum gradient with two rose radial glows, 24px corners and white text.
- **Layout:**
  - Left: kicker (`rose-pale`, preceded by a 24px rule), Display headline, lede and meta numbers.
  - Right: a glass sentiment panel with 20px corners, a Metric Hero score, a 10px pill stacked bar in sentiment colours, and a legend.
- **Watermark:** a faint giant brand word sits behind the hero.

### Evidence Quote (signature)
- White card with 14px corners and a 1px rose line. A 4px `rose-hot` left rule marks it as a quote.
- Padding 18px 20px; 13.5px text at 1.65 line height.
- The quote links back to its source row in the evidence table. The targeted row is highlighted `#fff1f5` with a 3px inset rose rule.

### Data Table
- **Header:** `#faf8f9`, slate 12.5px / 650.
- **Cells:** 13px; padding 13–15px by 16px; `line-divider` rows; `rose-wash` row hover.

## Do's and Don'ts

### Do:
- **Do** keep one dark plum hero per page and build everything else on white cards over `page-mist`.
- **Do** use the CTA gradient (`135deg, #fb6f92 → #e8557a`) only for the single primary action in a region and for active chips.
- **Do** use pills for every interactive control and 16–18px corners for containers.
- **Do** use tabular figures and `ink-heading` for every metric.
- **Do** link every quote and finding back to its source evidence.
- **Do** use the overview sentiment mapping (green / amber / rose) on every new chart.

### Don't:
- **Don't** use brand rose to mean positive or negative sentiment.
- **Don't** put `rose-pale` text on a light surface. It is for the dark hero only; it currently fails contrast on the light quality and backoffice heroes.
- **Don't** hardcode the client name in CSS. The hero watermark is currently `content: "LA GLACE"` in CSS and shows on any report.
- **Don't** introduce new neutrals. Use the slate set above, not plum-grey variants.
- **Don't** add a new font stack. Use the display stack for headings and numbers and the body stack for text.
