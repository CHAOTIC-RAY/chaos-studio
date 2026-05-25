# Agent instructions

## Cursor Cloud specific instructions

### Skills

- **uipro-cli** — Install or refresh UI/UX Pro Max in this repo with `npm install -g uipro-cli` then `uipro init --ai cursor` from the project root. Skill files: `.cursor/skills/uipro-cli/` and `.agents/skills/uipro-cli/`.
- **ui-ux-pro-max** — After `uipro init`, use `.cursor/skills/ui-ux-pro-max/SKILL.md` for UI/UX design work. Requires Python 3 for `search.py`.

### Project setup

```bash
npm install
```

Build and validate when changing app code:

```bash
npm run build
```
