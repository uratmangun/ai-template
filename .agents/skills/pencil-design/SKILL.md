---
name: pencil-design
description: Generate professional visual designs with the Pencil CLI (@pencil.dev/cli)—headless tool that writes structured `.pen` JSON and exports PNG/JPEG/WebP/PDF. Use when the user wants visual mocks, UI screens, landing pages, or design iterations from natural language; when they mention Pencil, `.pen` files, or CLI-based design generation; or when you should run a design agent and show an exported image. Requires Pencil CLI install and user auth (see body).
---

## Setup

Ensure the CLI is available:

```bash
which pencil || npx pencil version
```

Install if missing: `npm install -g @pencil.dev/cli`, or locally `npm install @pencil.dev/cli` and use `npx pencil`.

**Auth:** Run `pencil status`. If not logged in: `pencil signup ...` or `pencil login ...`, or set `PENCIL_CLI_KEY`. The CLI’s AI designer also expects a configured Claude Code user (env or subscription); if missing, explain options and help the user configure one.

**Version sync:** This skill is aligned with the npm package. Refresh by reinstalling the CLI and replacing this file from `node_modules/@pencil.dev/cli/SKILL.md` or a pinned URL: `https://unpkg.com/@pencil.dev/cli@latest/SKILL.md`. Compare `npm view @pencil.dev/cli version` to `pencil version` once per session before the first run.

## Create a design

Core invocation:

```bash
pencil --out <output.pen> --prompt "<design description>" --export <output.png> --export-scale 2
```

Important flags:

- `--out` / `-o` — `.pen` output (required)
- `--prompt` / `-p` — design brief (required)
- `--export` / `-e` — rasterize to an image
- `--export-scale` — e.g. `2` for sharp PNGs
- `--export-type` — `png` (default), `jpeg`, `webp`, `pdf`
- `--in` / `-i` — existing `.pen` for iteration
- `--model` / `-m` — Claude model (default Opus)

**Prompt rule:** Pass the user’s words as-is. Do not add layout, palette, or typography details the user did not say—the CLI’s agent owns creative decisions. Over-specifying hurts results.

**Runtime:** Simple designs often take 1–2 minutes; medium 2–3; complex 3–5+ minutes. Mention upfront. Run with a generous timeout (e.g. 600000 ms).

**After success:** Read the exported image with the Read tool so the user sees the visual.

## Iterate

```bash
pencil --in design.pen --out design-v2.pen --prompt "<changes>" --export design-v2.png --export-scale 2
```

Use a clear naming scheme (`design-v2.pen`, …) or overwrite with `--in design.pen --out design.pen`.

## Working directory

Write `.pen` and exports under the project (e.g. `designs/`), not ephemeral temp paths—the user will reopen and iterate.
