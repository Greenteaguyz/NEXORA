# NEXORA Workflow Diagrams

This directory contains the architecture and workflow diagrams for the NEXORA desktop storefront and creator platform.

## Files

| File | Description |
|---|---|
| [`nexora-workflow.html`](./nexora-workflow.html) | **Primary interactive diagram**. Self-contained Archify HTML/SVG artifact featuring 4 presets (Classic, Signal Flow, Blueprint, Editorial), dark/light themes, finite motion trace (`T`), guided story chapters, and node search (`/`). |
| [`nexora-workflow.json`](./nexora-workflow.json) | **Typed JSON IR specification** conforming to Archify `workflow` v2 schema (`schema_version: 2`) under the Showcase quality profile (0 crossings, 0 corridors, 0 errors). |
| [`nexora_visual_flowchart.html`](./nexora_visual_flowchart.html) | Reference standalone HTML flowchart. |

## Recompilation & Validation

To re-validate or re-deliver the diagram using Archify:

```bash
# Validate typed JSON IR against Showcase quality checks
node .agents/skills/archify/bin/archify.mjs validate workflow "diagram workflow/nexora-workflow.json" --quality showcase --json

# Deliver updated self-contained HTML
node .agents/skills/archify/bin/archify.mjs deliver workflow "diagram workflow/nexora-workflow.json" "diagram workflow/nexora-workflow.html" --quality showcase --json

# Open the diagram in your default browser
node .agents/skills/archify/bin/open-artifact.mjs "diagram workflow/nexora-workflow.html"
```
