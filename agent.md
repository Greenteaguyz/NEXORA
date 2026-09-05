# Agent Instructions

## Source of Truth
- Loop file: `.claude/vibecoder/performance-loop.md`.
- State: The progress file (`.claude/vibecoder/performance-progress.md`) and git history form the complete, authoritative state. Ignore memory of prior progress.

## General Rules
- **Verify before claiming**: Run typecheck/lint/test checks before declaring success.
- **One change = one scoped commit**: Confine every commit strictly to its prompt or task.
- **Never main/force-push**: Do not commit directly to `main` or force-push.
- **Revert-on-failure**: If changes cause new test/type failures that cannot be resolved in-scope, revert (`git checkout -- .`) and continue clean.
- **Decide, don't ask**: Operate fully unattended. Make sound technical decisions without halting for user prompts.

## Performance Audit
- **Trigger**: Run or resume with:
  > Run (or resume) the performance audit. Read agent.md and .claude/vibecoder/performance-loop.md and follow them exactly. The progress file and git history are the source of truth — ignore any memory of prior progress. Start from the first unchecked prompt. Work unattended; write the report file when all 100 are done.
- **Setup**: Commit WIP if working tree is dirty (`git status --short`). Check out or resume branch `vibecoder/performance`. Run `package.json` checks to record baseline test results in the progress file. Run a single production build to capture initial chunk sizes in `.claude/vibecoder/performance-baseline.md`.
- **Per-Prompt**: Ensure clean tree. Apply optimization or record N/A with reason. Run verification checks against baseline; revert and mark skipped if broken. Commit `perf N: <short title>`, mark `- [x]` with terse note, and advance to N+1. Every 10th prompt, re-run checks and one build to log deltas to the baseline file.
- **Done-State**: When all 100 prompts complete, write `.claude/vibecoder/performance-report.md` detailing applied count, grouped N/As, metrics deltas, and branch name.
