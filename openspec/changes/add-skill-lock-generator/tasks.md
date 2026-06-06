## 1. Script Structure

- [x] 1.1 Add a new bash script under `scripts/` for generating `skills-lock.json` when missing.
- [x] 1.2 Resolve the repository root from the script location and write the lock only at the root path.
- [x] 1.3 When `skills-lock.json` already exists, prompt the user to edit an entry or quit without changes.
- [x] 1.4 Validate required tooling such as `jq` before generation or editing.

## 2. Skill Discovery

- [x] 2.1 Discover installed project skills using `npx skills list --json`.
- [x] 2.2 Filter discovery results to project-scope skills and collect unique skill names.
- [x] 2.3 Add a fallback scanner for `.agents/skills/*/SKILL.md` when CLI discovery fails or returns no skills.
- [x] 2.4 Keep generated skill names sorted for stable lock output.

## 3. Source Mapping

- [x] 3.1 Add a static source map for known `npx skills add` compatible skills from the design.
- [x] 3.2 Generate lock entries only for discovered skills present in the known source map.
- [x] 3.3 Validate `sourceType` values against supported `skills` CLI source types: `github`, `gitlab`, `git`, `local`, and `well-known`.
- [x] 3.4 Report discovered skills that are skipped because no safe compatible source is known.
- [x] 3.5 Include clear skip reasons for OpenSpec-generated skills, `pencil-design`, and unknown/manual skills.

## 4. Existing Lock Editing

- [x] 4.1 List existing lock skill entries and allow the user to choose one to edit.
- [x] 4.2 Add an edit flow for changing an entry's `source` value.
- [x] 4.3 Add an edit flow for changing an entry's `sourceType` value with supported-type validation.
- [x] 4.4 Add an edit flow for changing an entry's `skillPath` value.
- [x] 4.5 Add a quit path that exits without modifying `skills-lock.json`.
- [x] 4.6 Apply edits with `jq` and write the updated lock atomically.

## 5. Lock Generation

- [x] 5.1 Write valid JSON with top-level `version: 1` and `skills` object.
- [x] 5.2 Ensure each generated skill entry includes `source` and `sourceType`.
- [x] 5.3 Include `skillPath` for known mappings when the path is known and useful for project updates.
- [x] 5.4 Write the file atomically or through a temporary file followed by move.
- [x] 5.5 Print a concise summary showing created entries and skipped skills.

## 6. Verification

- [x] 6.1 Run the generator in a missing-lock scenario and verify `jq` parses the output.
- [x] 6.2 Verify the existing update harness can read and group the generated lock.
- [x] 6.3 Verify running the generator with an existing lock can quit without changing the file.
- [x] 6.4 Verify editing `source`, `sourceType`, and `skillPath` updates only the selected field.
- [x] 6.5 Verify unsupported `sourceType` values are rejected without modifying the lock.
- [x] 6.6 Document the generator usage in script comments or adjacent project documentation if needed.
