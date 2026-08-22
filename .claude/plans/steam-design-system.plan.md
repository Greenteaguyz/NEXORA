# Plan: Steam Design System & Layout Consistency

**Source PRD**: `.claude/prds/steam-design-system.prd.md`
**Selected Milestone**: Milestone 5: Creator Studio, Orders & Full Light/Dark Contrast Audit
**Complexity**: Medium

## Summary
Establish complete alignment with the Steam DesignMD specification across all remaining surfaces (Creator Studio, Orders Receipt History, Account Profile, and Genres Directory) and audit high-contrast WCAG AAA compliance for both Dark (`#0E141B`/`#1B2838`) and Light (`#EBF0F5`/`#FFFFFF`) theme palettes.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Naming & Architecture | [`src/app/features/game-catalog/game-catalog.component.ts:1-20`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/game-catalog/game-catalog.component.ts#L1-L20) | Angular 17+ Standalone Components with Signals and `@if`/`@for` control flow |
| Design Tokens | [`src/styles.css:5-60`](file:///c:/Users/User/Downloads/AngularProject/src/styles.css#L5-L60) | Semantic CSS custom properties (`--bg-void`, `--bg-surface`, `--accent-400`, `--accent-600`) |
| Theme Handling | [`src/app/core/theme/theme.service.ts:1-30`](file:///c:/Users/User/Downloads/AngularProject/src/app/core/theme/theme.service.ts#L1-L30) | Attribute-driven theme switching on `document.documentElement` (`[data-theme="dark"]` / `[data-theme="light"]`) |
| Accessibility & Testing | [`src/app/core/tests/ui-forensics-and-layout-audit.ts:1-50`](file:///c:/Users/User/Downloads/AngularProject/src/app/core/tests/ui-forensics-and-layout-audit.ts#L1-L50) | WCAG AAA contrast assertions (minimum 7.0:1 for body text, 4.5:1 for badges/large text) |

## Files to Change
| File | Action | Why |
|---|---|---|
| [`src/styles.css`](file:///c:/Users/User/Downloads/AngularProject/src/styles.css) | UPDATE | Verify and refine Motiva/Outfit typography fallbacks, 1px Steam borders, and button hover states |
| [`src/app/features/creator-studio/creator-studio.component.css`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/creator-studio/creator-studio.component.css) | UPDATE | Polish Steamworks telemetry cards, status badges, and CRUD table contrast in dark and light modes |
| [`src/app/features/orders/orders.component.css`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/orders/orders.component.css) | UPDATE | Ensure Steam receipt invoice modal and purchase history table conform to Steam steel palette |
| [`src/app/features/profile/profile.component.css`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/profile/profile.component.css) | UPDATE | Align Steam persona profile card, avatar border glow, and wallet balance indicator |
| [`src/app/features/genres/genres.component.css`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/genres/genres.component.css) | UPDATE | Harmonize Category Hub cards with Steam tag cloud and category shelf styling |
| [`src/app/core/tests/ui-forensics-and-layout-audit.ts`](file:///c:/Users/User/Downloads/AngularProject/src/app/core/tests/ui-forensics-and-layout-audit.ts) | UPDATE | Add contrast and layout integrity verification cases |

## Tasks

### Task 1: Refine Global CSS Tokens & Utilities in `src/styles.css`
- **Action**: Check that all DesignMD Steam tokens (`--bg-void`, `--bg-surface`, `--bg-elevated`, `--accent-400`, `--accent-600`, `--text-primary`, `--text-secondary`, `--text-muted`) provide proper fallbacks and support both Dark and Light themes with WCAG AAA contrast.
- **Mirror**: DesignMD Steam specification and existing `:root` / `[data-theme="light"]` token declarations.
- **Validate**: Verify token resolution and contrast ratios across color pairs.

### Task 2: Polish Creator Studio Dashboard (`/studio`)
- **Action**: Enhance the Creator Studio view with Steamworks-inspired dark telemetry summary cards, status badges (`Active` / `Unpublished`), table borders, and modal dialogs.
- **Mirror**: [`src/app/features/game-detail/game-detail.component.css`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/game-detail/game-detail.component.css) card elevation and border glow.
- **Validate**: Visual and keyboard navigation inspection on `/studio`.

### Task 3: Polish Orders Purchase History & Invoice Modal (`/orders`)
- **Action**: Align order history table and printable invoice receipt modal with Steam purchase confirmation and billing summary styles.
- **Mirror**: [`src/app/features/orders/orders.component.html:143-260`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/orders/orders.component.html#L143-L260) receipt structure.
- **Validate**: Open receipt modal on test orders and verify print and screen rendering.

### Task 4: Polish User Profile & Account Settings (`/profile`)
- **Action**: Ensure Steam avatar frame, persona status pill, demo persona quick-switcher, and wallet balance display cleanly in both dark and light modes.
- **Mirror**: Steam Community profile and header user menu.
- **Validate**: Test with both `Alice (Creator)` and `Bob (Buyer)` demo accounts.

### Task 5: End-to-End Layout Consistency & Contrast Audit
- **Action**: Run comprehensive contrast and layout verification across all 12 feature routes (`/catalog`, `/genres`, `/games/:id`, `/creators/:id`, `/library`, `/wishlist`, `/orders`, `/profile`, `/studio`, `/studio/games/new`, `/studio/games/:id/edit`, `/support`).
- **Mirror**: [`src/app/core/tests/ui-forensics-and-layout-audit.ts`](file:///c:/Users/User/Downloads/AngularProject/src/app/core/tests/ui-forensics-and-layout-audit.ts).
- **Validate**: Zero contrast failures (>= 7.0:1 normal text, >= 4.5:1 UI components) and 0 layout shifts.

## Validation
```bash
# Verify component templates and styles integrity
npm run build
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Light mode contrast degradation with neon cyan/lime accents | Low | Use deep ocean blue (`#0078D4`) and forest emerald (`#558B2F`) overrides scoped under `[data-theme="light"]`. |
| Table layout clipping on small mobile viewports (<480px) | Medium | Wrap tables in `overflow-x: auto` wrappers with fixed minimum column widths. |

## Acceptance
- [ ] All tasks complete
- [ ] 100% of marketplace routes share unified Steam design tokens
- [ ] Dark and Light themes pass WCAG AAA contrast standards
- [ ] Responsive navigation and modal dialogs operate without clipping
