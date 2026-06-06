## Why

The skill update harness currently fails when `skills-lock.json` is missing, even though installed project skills can be discovered from `.agents/skills` and `npx skills list --json`. This creates unnecessary manual work before the harness can safely re-sync known skills.

## What Changes

- Add a bash script that creates `skills-lock.json` when missing and offers safe edit/quit choices when it already exists.
- Discover installed project skills from `npx skills list --json` and/or `.agents/skills`.
- Seed updateable skills with known `npx skills add` compatible sources.
- Record non-standard skills, such as OpenSpec-generated and raw npm/CDN skills, as skipped or provider-specific entries so the generator does not create misleading normal sources.
- When `skills-lock.json` exists, let the user modify selected skill metadata fields (`source`, `sourceType`, or `skillPath`) or quit without changes.
- Validate edited `sourceType` values against the source types supported by the `skills` CLI (`github`, `gitlab`, `git`, `local`, `well-known`).
- Keep the generated lock compatible with the current `scripts/skills-update-harnesses.sh` for entries it can update.

## Capabilities

### New Capabilities
- `skill-lock-generation`: Generate a project skill lock file from installed skill inventory when the lock is missing.

### Modified Capabilities
- None.

## Impact

- Adds a new script under `scripts/` for lock generation.
- May optionally be referenced by `scripts/skills-update-harnesses.sh`, but the update harness behavior should remain unchanged unless explicitly invoked.
- Requires `jq` and `npx skills list --json`, consistent with the existing harness dependency profile.
- Creates `skills-lock.json` at the repository root when missing.
