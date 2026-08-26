# NEXORA — Claude Code Entry Point

**`AGENTS.md` is the single source of truth for project directives — read it before working.** This file intentionally contains no duplicated rules.

@AGENTS.md

Absolute minimum if the import above is unavailable in your runtime:

- Angular 18, Standalone + Signals + `OnPush`, vanilla CSS per `DESIGN.md`
- Quality gate: `npm run verify` (build + unit + integration + master + impeccable) must be green before concluding work
- Surgical scope only; never delete files you didn't create this session
