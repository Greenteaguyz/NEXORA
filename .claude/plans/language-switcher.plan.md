# Plan: Language Switcher (EN/KH)

**Source PRD**: .claude/prds/language-switcher.prd.md
**Selected Milestone**: Milestone 1 & 2 (Header Switcher UI & Localization Infrastructure)
**Complexity**: Small

## Summary
To build the EN/KH language switcher without affecting the rest of the project (isolated execution), we will create a standalone `TranslationService` that uses Angular Signals to manage the active language and dictionary. Then, we will create a `LanguageSwitcherComponent` inside `src/app/shared/ui/` styled with Steam/shadcn aesthetics (matte backgrounds, crisp borders). Finally, we'll inject it into the `HeaderComponent`. We will follow Test-Driven Development (TDD) by writing unit tests for the service and component before implementing the logic.

> [!NOTE]
> Per your request for isolation, this plan will only translate a few keys in the header as proof-of-concept for the MVP. Full site translation can happen incrementally.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Naming | `src/app/core/auth/auth.service.ts` | Services go in `src/app/core/services/`, components in `src/app/shared/ui/` |
| Signals | `src/app/layout/header/header.component.ts` | Use `signal()` and `computed()` for reactive state |
| Tests | `tests/unit/unit-tests.spec.ts` | Use centralized `unit-tests.spec.ts` or co-located `.spec.ts` for logic |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/app/core/services/translation.service.ts` | CREATE | Manages the active language state and translation dictionary via Signals |
| `src/app/shared/ui/language-switcher/language-switcher.component.ts` | CREATE | The standalone shadcn-styled dropdown component (TypeScript logic) |
| `src/app/shared/ui/language-switcher/language-switcher.component.html` | CREATE | The dropdown markup |
| `src/app/shared/ui/language-switcher/language-switcher.component.css` | CREATE | The Steam-inspired styling |
| `src/app/layout/header/header.component.html` | UPDATE | Drop the `<app-language-switcher>` component into the header bar |
| `tests/unit/unit-tests.spec.ts` | UPDATE | Add tests for `TranslationService` before implementing |

## Tasks

### Task 0: Translation Dictionary
- **Action**: Create `en.json` and `kh.json` with a small set of header keys. We will use Google Translate for the KH translations, and fallback to English for any gaming/technical terms that don't translate accurately.

### Task 1: TDD - Translation Service
- **Action**: Write unit tests for `TranslationService` that verify it initializes with 'en', can switch to 'kh', and returns fallback keys if a translation is missing. Then implement the service.
- **Mirror**: `tests/unit/unit-tests.spec.ts`
- **Validate**: `npm run test:unit`

### Task 2: Build the UI Component
- **Action**: Build `LanguageSwitcherComponent` using `@if` for the dropdown menu, adhering to the `DESIGN.md` matte slate aesthetic (`var(--bg-elevated)`). Ensure it closes when clicking outside.
- **Mirror**: `RoleBadgeComponent` for standalone component structure.
- **Validate**: Component compiles successfully with `npm run build`.

### Task 3: Header Integration
- **Action**: Import `LanguageSwitcherComponent` in `HeaderComponent`'s `imports` array, and place the tag `<app-language-switcher>` inside the header HTML next to the Theme Switcher.
- **Mirror**: Theme switcher placement.
- **Validate**: UI renders correctly and `npm run test:regression` passes.

## Validation
```bash
npm run verify
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Menu z-index overlap | Low | Use `z-index: 50` and absolute positioning for the dropdown. |
| Test suite breakage | Low | Following the isolation request, we will keep tests localized to the new service and not rewrite existing tests unless they explicitly assert on header child counts. |

## Acceptance
- [ ] All TDD tests pass
- [ ] Language Switcher renders correctly in the header
- [ ] Clicking EN/KH successfully updates the internal Signal state
- [ ] Zero new NPM packages added (ponytail constraint)
