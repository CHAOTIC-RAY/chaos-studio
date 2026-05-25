---
name: uipro-cli
description: >-
  Install, update, or reinstall UI/UX Pro Max in a project using uipro-cli.
  Use when the user asks to set up UI/UX Pro Max, install uipro-cli, run
  uipro init, add the design skill to Cursor, or configure UI/UX Pro Max for
  any AI assistant. Triggers: uipro-cli, uipro init, UI/UX Pro Max install,
  ui-ux-pro-max-skill, design skill setup.
metadata:
  author: ui-ux-pro-max-skill
  version: "1.0.0"
  surfaces: cloud
environments:
  - cloud
  - local
---

# UI/UX Pro Max CLI (uipro-cli)

Use this skill to install or refresh the [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) design skill via the official CLI. Do not hand-copy platform folders from the repo; the CLI generates the correct layout from templates.

## When to use

- User wants UI/UX Pro Max in the current project or globally
- User mentions `uipro-cli`, `uipro init`, or installing a UI/UX design skill
- UI/UX work is requested but `.cursor/skills/ui-ux-pro-max/` (or the target assistant path) is missing

## Prerequisites

1. **Node.js and npm** — required for the CLI
2. **Python 3.x** — required by the installed skill’s search scripts

```bash
node --version
python3 --version || python --version
```

If Python is missing, install it before or right after `uipro init` (macOS: `brew install python3`; Ubuntu/Debian: `sudo apt update && sudo apt install python3`; Windows: `winget install Python.Python.3.12`).

## Installation workflow

Run from the **project root** (or use `--global` when supported — confirm with `uipro init --help`).

### Step 1: Install the CLI globally

```bash
npm install -g uipro-cli
```

Verify:

```bash
uipro --version
```

### Step 2: Initialize for the target assistant

**In Cursor**, always use:

```bash
cd /path/to/your/project
uipro init --ai cursor
```

### Step 3: Confirm install and tell the user to reload

After success, the Cursor skill lives at:

```
.cursor/skills/ui-ux-pro-max/
```

Tell the user to **restart Cursor** or reload the window so the new skill is picked up.

## Supported `--ai` values

| Flag | Assistant |
|------|-----------|
| `claude` | Claude Code |
| `cursor` | Cursor |
| `windsurf` | Windsurf |
| `antigravity` | Antigravity |
| `copilot` | GitHub Copilot |
| `kiro` | Kiro |
| `codex` | Codex CLI |
| `qoder` | Qoder |
| `roocode` | Roo Code |
| `gemini` | Gemini CLI |
| `trae` | Trae |
| `opencode` | OpenCode |
| `continue` | Continue |
| `codebuddy` | CodeBuddy |
| `droid` | Droid (Factory) |
| `kilocode` | KiloCode |
| `warp` | Warp |
| `augment` | Augment |
| `all` | All supported assistants |

If `uipro init --help` lists fewer values than above, prefer the help output and upgrade the CLI: `npm install -g uipro-cli@latest`.

## Common options

```bash
uipro init --ai cursor --force     # Overwrite existing install
uipro init --ai cursor --offline   # Use bundled assets only (no GitHub fetch)
```

**Global install** (all projects for one assistant), when available:

```bash
uipro init --ai cursor --global    # Typically ~/.cursor/skills/
```

## Other CLI commands

```bash
uipro versions          # List published skill versions
uipro update            # Update installed skill to latest
```

Uninstall (if your CLI version supports it):

```bash
uipro uninstall
uipro uninstall --ai cursor
uipro uninstall --global
```

## Agent behavior

1. **Detect context** — Use the workspace root as the project path unless the user specifies another directory.
2. **Prefer Cursor** — In Cursor, run `uipro init --ai cursor` unless the user names a different assistant.
3. **Check before overwriting** — If `.cursor/skills/ui-ux-pro-max/` already exists, ask before using `--force`, or explain that `--force` will replace files.
4. **Run commands yourself** — Execute install/init in the terminal; do not only paste instructions unless the user cannot run commands.
5. **After install** — For UI/UX implementation tasks, follow the installed skill at `.cursor/skills/ui-ux-pro-max/SKILL.md` (design system search, stack guidelines, pre-delivery checklist).

## Troubleshooting

| Issue | Action |
|-------|--------|
| `uipro: command not found` | Re-run `npm install -g uipro-cli` and ensure global npm bin is on `PATH` |
| Permission errors on global install | Use a user-level npm prefix or `sudo` only if the user approves |
| Python errors when using the skill | Install Python 3 and retry prompts that call `search.py` |
| Stale or broken install | `uipro init --ai cursor --force` or `uipro update` |
| No network | `uipro init --ai cursor --offline` |

## References

- npm: https://www.npmjs.com/package/uipro-cli
- Repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
