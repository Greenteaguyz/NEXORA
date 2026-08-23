# NEXORA — Project Guidelines & Memory

## Stack & Commands
- **Framework**: Angular 18 (Signals, `OnPush`, Standalone)
- **Design System**: Steam DesignMD (`DESIGN.md`, `src/styles.css`)
- **Verification**: `npm run verify`

## Mandatory Autonomous Directives (No User Permission Required)
- **Before coding**: Conduct a mandatory **SWOT Analysis** (Strengths, Weaknesses, Opportunities, Threats) on the plan to catch risks, accessibility gaps, and state hazards early.
- **During coding**: Auto-invoke relevant skills (`angular-signals-best-practices`, `a11y-standards-auditor`, `web-perf-cwv`, `spatial-navigation-ux`, `/impeccable audit`, `click-path-audit`, `e2e-testing`).
- **After every 1–2 tasks**: 
  1. **Auto-Update Tests**: Automatically author new unit tests (logic/validations), integration tests (navigation/redirects), link crawler cases (`tests/unit/`, `tests/integration/`, `tests/audit/`, `tests/e2e/`), and click-path state audits for shared signal stores.
  2. **Auto-Prune Files**: Automatically delete redundant, obsolete, or temporary test/workflow files.
  3. **Verification Loop**: Auto-run `/impeccable audit` -> `npm run verify` -> auto-fix failures -> `agent-self-evaluation` -> report test evidence.
- **Delivery Gate**: Zero failure tolerance. Code is never delivered with broken tests, without test coverage, or with workspace clutter.
