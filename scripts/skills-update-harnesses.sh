#!/usr/bin/env bash
# Re-sync skills from skills-lock.json to ONLY the agent harnesses in HARNESS_AGENTS.
# Each `npx skills add` run uses explicit -s <name> flags from the lock (never -s '*').
# Prefer this over `npx skills update`, which can refresh every installed skill project-wide.
# https://github.com/vercel-labs/skills#available-agents

# NOTE: 'set -e' removed so one failing source doesn't abort the whole script
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

EXTRA=()
if [[ "${1:-}" == "--" ]]; then
  shift
  EXTRA=("$@")
fi

LOCK="${ROOT}/skills-lock.json"
if [[ ! -f "$LOCK" ]]; then
  echo "missing $LOCK" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "install jq to run this script" >&2
  exit 1
fi

# Only target universal agents (skills land in .agents/skills).
# .cursor/skills and .windsurf/skills should be symlinks to .agents/skills.
# .opencode/skills is kept as a directory; run 'npx skills add -a opencode'
# to let the CLI manage its symlink, or keep it separate.
HARNESS_AGENTS=(cursor opencode windsurf)

AG_ARGS=()
for a in "${HARNESS_AGENTS[@]}"; do
  AG_ARGS+=(-a "$a")
done

ensure_harness_symlinks() {
  local agents_dir="${ROOT}/.agents/skills"
  local link

  if [[ ! -d "$agents_dir" ]]; then
    echo ">> WARNING: missing $agents_dir — skipping harness symlink repair" >&2
    return 0
  fi

  for link in .cursor/skills .windsurf/skills; do
    local target="${ROOT}/${link}"
    local parent
    parent="$(dirname "$target")"

    if [[ ! -d "$parent" ]]; then
      echo ">> WARNING: missing $parent — skipping $link" >&2
      continue
    fi

    if [[ -L "$target" ]]; then
      continue
    fi

    if [[ -e "$target" ]]; then
      echo ">> WARNING: $link exists but is not a symlink — leaving it unchanged" >&2
      continue
    fi

    ln -s ../.agents/skills "$target"
    echo ">> linked $link -> ../.agents/skills"
  done
}

echo ">> syncing from skills-lock.json → agents: ${HARNESS_AGENTS[*]}"

while read -r line; do
  src="$(echo "$line" | jq -r '.source')"
  source_type="$(echo "$line" | jq -r '.sourceType')"
  mapfile -t skills < <(echo "$line" | jq -r '.skills[]')
  if [[ ${#skills[@]} -eq 0 ]]; then
    continue
  fi
  if [[ "$source_type" == "well-known" && "$src" != http://* && "$src" != https://* ]]; then
    src="https://${src}"
  fi
  SK_ARGS=()
  for s in "${skills[@]}"; do
    SK_ARGS+=(-s "$s")
  done
  echo ">> $src [$source_type] (${#skills[@]} skill(s))"
  # Do not read from the jq pipe (would swallow remaining groups).
  # Continue on failure so one bad source doesn't block the rest.
  if ! npx skills add "$src" -y "${AG_ARGS[@]}" "${SK_ARGS[@]}" "${EXTRA[@]}" < /dev/null; then
    echo ">> WARNING: failed to install from $src — continuing with next source" >&2
  fi
done < <(jq -c '.skills | to_entries | group_by([.value.source, .value.sourceType])[] | {source: .[0].value.source, sourceType: .[0].value.sourceType, skills: [.[].key]}' "$LOCK")

ensure_harness_symlinks

echo ">> done"
