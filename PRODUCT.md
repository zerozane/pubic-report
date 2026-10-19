# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: the client brand's team (marketing, brand and product managers) who commissioned the report. They read it on a desktop computer, usually in a focused sitting, to understand what customers are saying about their brand and products and to decide what to change in products, content and campaigns.

Secondary (internal): the Wanda Sphere analysts who collect, review and publish each report through the backoffice (`/backoffice`).

## Product Purpose

A paid social-listening and product-quality report service, delivered as a web report per client and topic. Each report turns public customer voice — social posts and comments plus marketplace product reviews — into findings the brand team can act on.

Success: the client trusts the findings enough to act on them, and pays for the report (and ideally for repeat reports).

## Positioning

- Every conclusion is backed by real, traceable evidence: each insight links to the original comments or reviews it was drawn from.
- Thai-language sentiment and topics are reviewed by people who understand Thai language and context, not left to automated classification alone.
- Social conversation (TikTok, X) and product reviews (Shopee) are read together, so brand perception connects to actual product quality.
- Findings end in concrete recommendations the brand can act on, not just numbers.

## Operating Context

- Reports are fixed snapshots, not real-time dashboards: data is collected in rounds (Bright Data, Apify), normalized, reviewed by an analyst, saved as JSON in `data/reports/`, then built and deployed. Opening a report never triggers new scraping.
- Report sections: summary, engagement, evidence (search and filter by platform, sentiment and keyword), and product quality.
- Readers can print to PDF and download approved data as CSV.
- Main reading device: desktop computer. Print/PDF output must stay usable.

## Capabilities and Constraints

- Stack: Next.js App Router, React, TypeScript, global CSS; charts in SVG/CSS without a chart library; data as JSON files, no database or separate backend.
- Cards, charts and tables are computed from one dataset per report so totals never disagree.
- Unknown values stay `null`, never `0`; unclassified sentiment (`null`) differs from `neutral`.
- Published reports must not contain demo evidence (`isDemo: true`).
- Open decision: pricing, packaging and what is included per report are not yet defined.
- Open decision: whether the Wanda Sphere / service name appears anywhere on client reports.
- Needs qualified review (not decided here): PDPA/privacy handling of public usernames and comment text shown as evidence, and platform terms for collected data.

## Brand Commitments

- Reports carry the client's brand as the primary identity (client-branded, not Wanda Sphere-branded). The current "PUBLIC / NOTE" label in the code is not a confirmed product name.
- Content language is Thai.

## Evidence on Hand

- Report datasets in `data/reports/`, mostly for LA GLACE (social reports from TikTok/X, TikTok comments Sep–Oct 2026, Shopee product-quality reports), plus an `iphone-18-selected-tiktok` dataset.
- No client testimonials, case studies, published pricing or performance benchmarks exist yet; future work must not invent them.

## Product Principles

1. Evidence first: no finding without traceable source comments or reviews behind it.
2. Decision-ready: every section should help the brand team decide what to do next, not just display metrics.
3. The client's brand leads; our presence stays in the rigor of the method, not the logo.
4. Honest numbers: show sample size, period, sources and limitations; never imply full-market coverage.
5. Thai context matters: language, slang and cultural nuance are part of the analysis, not noise.

## Accessibility & Inclusion

Thai-language content (`lang="th"`) must render and wrap correctly, including long Thai strings without spaces, on screen and in print.
