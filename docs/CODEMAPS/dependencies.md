<!-- Generated: 2026-09-05 | Files scanned: 101 | Token estimate: ~500 -->
# NEXORA Dependencies & Engineering Constraints

## Primary Stack
- **Framework**: Angular 18 (Standalone components, Zoneless-ready Signals, OnPush change detection).
- **Reactivity**: Angular Signals (`signal()`, `computed()`) + RxJS `takeUntilDestroyed()`.
- **CSS Architecture**: Native CSS Custom Properties with scoped component styles. Zero Tailwind runtime overhead.
- **External UI Libraries**: **ZERO** (No Bootstrap, Angular Material, PrimeNG, or jQuery).

## Font Stack Ordering (Anti-Glyph Hijacking Rule)
```css
--font-sans: 'Plus Jakarta Sans', 'Noto Sans Khmer', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Outfit', 'Noto Sans Khmer', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```
*Invariant: Primary Latin fonts strictly precede localized Khmer fonts to avoid Latin glyph hijacking in numerals and code.*

## Quality Gate Suites
1. `npm run build` — Production compile into `dist/` with clean bundle sizes.
2. `npm run test:unit` — 687 unit tests.
3. `npm run test:integration` — 324 integration tests.
4. `npm run test:master` — 23 comprehensive master battery tests.
5. `npm run test:impeccable` — 7 anti-slop & DesignMD tests.
6. `npm run test:theme-contrast` — 7 theme contrast & WCAG AAA tests.
