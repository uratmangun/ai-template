# AI IDE Template

A starter template for AI-assisted development with standardized rules, skills, and OpenSpec workflows.

## Clone this template

```bash
gh repo create my-new-repo --template uratmangun/ai-ide-template --private --clone
```

## What's included

- `.agents/skills/` — agent skills for AI SDK, Cloudflare, OpenSpec, and more
- `.cursor/` and `.opencode/` — IDE rules and commands
- `openspec/` — change proposals and archived specs
- `scripts/` — skill lock and harness utilities

## Skills

Update skill harnesses:

```bash
./scripts/skills-update-harnesses.sh
```

Create or refresh the skills lock file:

```bash
./scripts/skills-create-lock.sh
```
