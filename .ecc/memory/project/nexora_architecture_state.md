---
id: mem_nexora_architecture_state_v1
kind: context
title: NEXORA Architecture, Impeccable Design Standard & Test Coverage State
source_harness: antigravity
target: all
tags: [architecture, design-system, impeccable, steam, testing, auth, catalog, memory]
created_at: 2026-08-23T00:12:00Z
trust: unreviewed
---

# NEXORA Architecture & Impeccable Design State

## 1. Project Overview & Tech Stack
- **Framework**: Angular 18 (Standalone Components, Signals, Reactive RxJS data services)
- **Styling**: Vanilla CSS with CSS Custom Properties tokens (`src/styles.css`)
- **Design System**: Steam DesignMD Standard enforced via **Impeccable** (`DESIGN.md`, `.agents/skills/impeccable/`, `.agents/rules/impeccable.md`)

## 2. Key Architectural Decisions & De-Slopped Principles
- **Featured Showcase**: Authentic Steam 2-column capsule (65% 16:9 media viewport + 35% info capsule with 2×2 interactive screenshot grid updating preview on hover).
- **Secondary Headers**: Monospace eyebrow breadcrumbs (`STORE / GENRES`, `COMMUNITY / WISHLIST`, etc.) + `h1` titles (no repetitive 52px gradient boxes).
- **Geometry & Tokens**: Standardized 6px button radius, 8px card radius, 4px badge radius. Natural directional occlusion shadows (`0 4px 16px rgba(0,0,0,0.45)`). Zero neon glow blur halos.
- **Semantic Colors**: Steam Green (`#75B022`) for CTAs, Steam Cyan (`#66C0F4`) for interactive links, Rose (`#F43F5E`) for Wishlist.

## 3. Comprehensive Test Suite Architecture (`src/app/core/tests/` & `tests/`)
- `tests/unit/unit-tests.spec.ts`: Form validations, data transforms, revenue split (90/10), storage prefixing (20/20 PASS).
- `tests/integration/integration-tests.spec.ts`: Auth personas, catalog query engine, orders & payment methods, studio CRUD (18/18 PASS).
- `src/app/core/tests/master-test-battery.ts`: Master runner orchestrating core models, wishlist, library, theme, and seed invariants (10/10 PASS).
- `src/app/core/tests/impeccable-anti-slop.spec.ts`: Deterministic anti-slop constraint verification, 13-view radii hierarchy, semantic colors, easing curves, WCAG AAA contrast (7/7 PASS).
- **Total Regression Suite**: 55 / 55 tests passing (100%), 0 TypeScript errors, 2.75s production bundle (96.87 kB initial transfer).
- **Industrial Geometry Standard**: 100% compliant across all 13 views (0 residual bubble pills on utility buttons, crisp 6px buttons, 4px badges/filters, 2px micro-tags).


