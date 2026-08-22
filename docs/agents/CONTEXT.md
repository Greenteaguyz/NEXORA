# Project Context: NEXORA (Angular)

## Overview
**NEXORA** is a next-generation indie and cyberpunk game discovery, distribution marketplace, and creator studio built with **Angular 18+**, TypeScript, and modern component design.

## Core Design System & Token Contract (Steam Design System)
- **Typography Architecture**:
  - **Display & Headings**: `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (Weights: 700, 800, 900) with `letter-spacing: -0.02em`. Used for all `h1-h6`, hero titles, card titles, and modal headers.
  - **UI & Body**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (Weights: 400, 500, 600, 700). Used for navigation, paragraphs, inputs, dropdowns, and button labels.
  - **Tech Specs & Monospace**: `'JetBrains Mono', monospace` (Weights: 500, 600, 700). Used for price badges, `[60 FPS]`, `[DRM-FREE BUILD]`, genre filter chips, and stats counters.
- **Color Palette (Dark Theme — Steam Navy)**:
  - Canvas / Void: `--bg-void: #0E141B;`
  - Cards & Header Surfaces: `--bg-surface: #1B2838;` (Glass: `rgba(27, 40, 56, 0.92)`)
  - Elevated / Popovers / Modals: `--bg-elevated: #2A475E;`
  - Inputs & Search: `--bg-input: #121A24;`
  - Card & Container Borders: `--border-card: #2A475E;` (Subtle: `rgba(102, 192, 244, 0.2)`)
  - Primary CTA (Buy, Play, Save): `--accent-600: #75B022;` (Steam Action Lime Green)
  - Glow & Links: `--cyan-400: #66C0F4;` (Steam Electric Cyan)
  - Wishlist Heart: `--rose-500: #F43F5E;` (Radiant Rose)
  - Community Rating Star: `--amber-400: #E5A93C;` (Steam Gold)
  - Semantic Text: Primary `#F8FAFC`, Secondary `#C7D5E0`, Muted `#8F98A0`.
- **Color Palette (Light Theme — Steam Silver Slate WCAG AAA)**:
  - Canvas: `--bg-void: #EBF0F5;`
  - Surfaces: `--bg-surface: #FFFFFF;`
  - Elevated: `--bg-elevated: #E1E8EF;`
  - Card Borders: `--border-card: #D2DBE3;`
  - Primary CTA: `--accent-600: #558B2F;`
  - Links / Accents: `--cyan-400: #0078D4;`
  - Wishlist Heart: `--rose-500: #E11D48;`
  - Semantic Text: Primary `#0F172A` (16.2:1), Secondary `#2D3748` (9.8:1), Muted `#5A6A80` (6.4:1).
- **Universal Layout Standards**:
  - Container Max Width: Strict `max-width: 1400px; margin: 0 auto;` on Header, Footer, and all 10 page routes.
  - Standard Page Padding: `padding: var(--space-8) clamp(16px, 3.5vw, 56px) var(--space-12);`
  - Card Grid: `grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: var(--space-6);`

## Critical Developer & Agent Quality Rules
1. **Zero Hardcoded Colors**: Never hardcode hex/rgba values inside component CSS files. Always consume CSS variables (`var(--accent-600)`, `var(--cyan-400)`, `var(--bg-surface)`, etc.).
2. **Deep Codebase Purge on Token Shifts**: When modifying any visual theme or token, run a global grep scan across `src/` to guarantee no legacy hardcoded colors bypass the design system.
3. **Typography Rigor**: All headings MUST use `var(--font-display)`, body text MUST use `var(--font-sans)`, and metadata/specs MUST use `var(--font-mono)`.
4. **Automated Verification Gate**: Every commit and feature change must pass the 7-layer verification battery (`npm run test:all`): Unit tests, Integration tests, 33 E2E tests, 6 Axe WCAG AA route audits, 13-route link crawler, Performance budgets, and SEO audits.

## Architecture Highlights
- **Framework**: Angular 18+ (Standalone Components, Signals & RxJS).
- **State Management**: Reactive singleton services with Angular Signals and RxJS `BehaviorSubject` / `Observable` streams.
- **Routing**: Angular Router with lazy loading, functional route guards (`authGuard`, `roleGuard`, `ownershipGuard`).
- **Key Directories**:
  - `src/app/core/`: Singleton services, guards, interceptors, models, mock databases.
  - `src/app/shared/`: Reusable UI components (`game-card`, `download-button`, `purchase-confirm-modal`, `loading-spinner`, `empty-state`).
  - `src/app/features/`: Feature pages (`game-catalog`, `game-detail`, `genres`, `library`, `wishlist`, `orders`, `profile`, `creator-profile`, `creator-studio`, `support`, `auth`).
  - `scripts/`: Verification runners, crawler tools, and cleanup scripts (`purge-purple.js`, `verify-all.js`).
