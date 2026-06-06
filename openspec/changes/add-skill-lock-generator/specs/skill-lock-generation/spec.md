## ADDED Requirements

### Requirement: Generate missing skill lock
The system SHALL provide a script that creates a repository-root `skills-lock.json` when no lock file exists.

#### Scenario: Lock is absent
- **WHEN** the user runs the generator script in a project without `skills-lock.json`
- **THEN** the system SHALL create `skills-lock.json` with `version` set to `1` and a `skills` object

#### Scenario: Lock already exists
- **WHEN** the user runs the generator script in a project with an existing `skills-lock.json`
- **THEN** the system SHALL offer choices to edit supported lock metadata or quit without changes

#### Scenario: User quits existing lock flow
- **WHEN** the user chooses to quit after the script detects an existing `skills-lock.json`
- **THEN** the system SHALL leave the existing file unchanged

### Requirement: Discover installed project skills
The system SHALL discover installed project skills from the current workspace before generating the lock.

#### Scenario: Skills CLI returns installed skills
- **WHEN** `npx skills list --json` returns project skills
- **THEN** the system SHALL use the returned skill names as the generated lock inventory

#### Scenario: Skills CLI is unavailable or returns no project skills
- **WHEN** the skills CLI cannot provide an installed skill inventory
- **THEN** the system SHALL fall back to scanning `.agents/skills/*/SKILL.md` for skill names

### Requirement: Use safe source mappings
The system SHALL only generate normal update entries for skills with known `npx skills add` compatible sources.

#### Scenario: Skill has known skills CLI source
- **WHEN** an installed skill matches a known source mapping
- **THEN** the system SHALL write an entry containing `source` and `sourceType` suitable for `scripts/skills-update-harnesses.sh`

#### Scenario: Skill has no known safe source
- **WHEN** an installed skill has no known `npx skills add` compatible source mapping
- **THEN** the system SHALL not invent a source for that skill

### Requirement: Report skipped skills
The system SHALL clearly report installed skills that were not added to the generated lock.

#### Scenario: Non-standard skills are present
- **WHEN** installed skills require provider-specific updates, raw URL updates, or manual source confirmation
- **THEN** the system SHALL print those skill names with a reason they were skipped

#### Scenario: All installed skills are mapped
- **WHEN** every discovered skill has a known compatible source mapping
- **THEN** the system SHALL report that no skills were skipped

### Requirement: Produce harness-compatible JSON
The generated lock SHALL be valid JSON compatible with the existing update harness grouping logic.

#### Scenario: Harness reads generated lock
- **WHEN** `scripts/skills-update-harnesses.sh` reads the generated `skills-lock.json`
- **THEN** every generated entry SHALL contain the fields required by the harness: `source` and `sourceType`

#### Scenario: JSON tooling validates lock
- **WHEN** `jq` parses the generated `skills-lock.json`
- **THEN** parsing SHALL succeed without errors

### Requirement: Edit existing lock entries
The system SHALL allow the user to update supported metadata fields for existing `skills-lock.json` skill entries.

#### Scenario: User edits source
- **WHEN** the user selects a skill entry and provides a new `source`
- **THEN** the system SHALL update only that skill entry's `source` value

#### Scenario: User edits source type
- **WHEN** the user selects a skill entry and provides a new `sourceType`
- **THEN** the system SHALL update the `sourceType` only if it is one of `github`, `gitlab`, `git`, `local`, or `well-known`

#### Scenario: User edits skill path
- **WHEN** the user selects a skill entry and provides a new `skillPath`
- **THEN** the system SHALL update only that skill entry's `skillPath` value

#### Scenario: User provides unsupported source type
- **WHEN** the user provides a `sourceType` that is not supported by the `skills` CLI source parser
- **THEN** the system SHALL reject the value and leave the existing entry unchanged

#### Scenario: Existing lock remains valid after edit
- **WHEN** the script updates any supported lock metadata field
- **THEN** the resulting `skills-lock.json` SHALL remain valid JSON parseable by `jq`
