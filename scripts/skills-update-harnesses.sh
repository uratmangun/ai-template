#!/usr/bin/env bash
# Re-sync skills from skills-lock.json to the agent harnesses that are ACTUALLY
# present in this repo.
#
# Harnesses are detected from the agent dot-directories at the repo root, so the
# script never creates a harness directory you do not use (e.g. .windsurf).
# `.agents/skills` is the canonical store; `universal` writes there and every
# harness that reads it directly is covered by that single flag.
#
# Each `skills add` run uses explicit -s <name> flags from the lock (never -s '*').
# Prefer this over `skills update`, which can refresh every installed skill project-wide.
# https://github.com/vercel-labs/skills#available-agents
#
# Usage:
#   scripts/skills-update-harnesses.sh                 # auto-detect harnesses
#   scripts/skills-update-harnesses.sh -- --copy       # extra flags go to `skills add`
#   HARNESS_AGENTS="cursor opencode" ...               # override detection
#   SKILLS_CMD="bunx skills" ...                       # override the CLI invocation

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

# ---------------------------------------------------------------------------
# Harness detection
# ---------------------------------------------------------------------------

# Agent dot-directory -> `skills` CLI agent id(s).
# Source of truth: the skillsDir registry inside the `skills` CLI.
# If this table drifts, `skills add <src> -a bogus-agent` prints every valid id.
declare -A AGENT_IDS_BY_DIR=(
  # Harnesses that read .agents/skills directly but still own a dot-directory.
  [.cline]="cline"
  [.codex]="codex"
  [.cursor]="cursor"
  [.gemini]="gemini-cli"
  [.github]="github-copilot"
  [.kilo]="kilo"
  [.opencode]="opencode"
  # Harnesses with their own dedicated skills directory.
  [.adal]="adal"
  [.aider-desk]="aider-desk"
  [.augment]="augment"
  [.autohand]="autohand-code"
  [.bob]="bob"
  [.claude]="claude-code"
  [.codeartsdoer]="codearts-agent"
  [.codebuddy]="codebuddy"
  [.codemaker]="codemaker"
  [.codestudio]="codestudio"
  [.commandcode]="command-code"
  [.continue]="continue"
  [.cortex]="cortex"
  [.crush]="crush"
  [.devin]="devin"
  [.forge]="forgecode"
  [.goose]="goose"
  [.grok]="grok"
  [.hermes]="hermes-agent"
  [.iflow]="iflow-cli"
  [.inferencesh]="inference-sh"
  [.jazz]="jazz"
  [.junie]="junie"
  [.kimchi]="kimchi"
  [.kiro]="kiro-cli"
  [.kode]="kode"
  [.lingma]="lingma"
  [.mcpjam]="mcpjam"
  [.minimax]="minimax-code"
  [.moxby]="moxby"
  [.mux]="mux"
  [.neovate]="neovate"
  [.ona]="ona"
  [.openhands]="openhands"
  [.pochi]="pochi"
  [.posit]="posit-assistant"
  [.qoder]="qoder qoder-cn"
  [.qwen]="qwen-code"
  [.reasonix]="reasonix"
  [.roo]="roo"
  [.rovodev]="rovodev"
  [.tabnine]="tabnine-cli"
  [.terramind]="terramind"
  [.tinycloud]="tinycloud"
  [.trae]="trae trae-cn"
  [.vibe]="mistral-vibe"
  [.windsurf]="windsurf"
  [.zcode]="zcode"
  [.zencoder]="zencoder zenflow"
)

# Harnesses that only look inside their own dot-directory, so `<dir>/skills`
# must be a symlink to .agents/skills. Only acted on when the dir already exists.
# .opencode is deliberately absent: this template keeps a real .opencode/skills
# directory for the OpenSpec skills.
SYMLINK_HARNESS_DIRS=(.cursor .windsurf)

detect_harness_agents() {
  local dir ids
  local -a found=()

  for dir in "${!AGENT_IDS_BY_DIR[@]}"; do
    [[ -d "${ROOT}/${dir}" ]] || continue
    read -r -a ids <<< "${AGENT_IDS_BY_DIR[$dir]}"
    found+=("${ids[@]}")
  done

  # .agents/skills is the canonical store for every "universal" harness.
  if [[ -d "${ROOT}/.agents" ]]; then
    found+=(universal)
  fi

  if [[ ${#found[@]} -gt 0 ]]; then
    printf '%s\n' "${found[@]}" | sort -u
  fi
}

# ---------------------------------------------------------------------------
# Skills CLI resolution (npx is not always installed; bun users have bunx only)
# ---------------------------------------------------------------------------

resolve_skills_cmd() {
  if [[ -n "${SKILLS_CMD:-}" ]]; then
    read -r -a SKILLS_BIN <<< "$SKILLS_CMD"
  elif command -v npx >/dev/null 2>&1; then
    SKILLS_BIN=(npx --yes skills)
  elif command -v bunx >/dev/null 2>&1; then
    SKILLS_BIN=(bunx skills)
  elif [[ -x "${HOME}/.bun/bin/bunx" ]]; then
    SKILLS_BIN=("${HOME}/.bun/bin/bunx" skills)
  elif command -v pnpm >/dev/null 2>&1; then
    SKILLS_BIN=(pnpm dlx skills)
  elif command -v yarn >/dev/null 2>&1; then
    SKILLS_BIN=(yarn dlx skills)
  else
    echo "no skills CLI runner found (tried npx, bunx, pnpm, yarn)" >&2
    echo "set SKILLS_CMD to the full command, e.g. SKILLS_CMD='bunx skills'" >&2
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Symlink repair
# ---------------------------------------------------------------------------

ensure_harness_symlinks() {
  local agents_dir="${ROOT}/.agents/skills"
  local link

  if [[ ! -d "$agents_dir" ]]; then
    echo ">> WARNING: missing $agents_dir — skipping harness symlink repair" >&2
    return 0
  fi

  for link in "${SYMLINK_HARNESS_DIRS[@]}"; do
    local target="${ROOT}/${link}/skills"
    local parent
    parent="$(dirname "$target")"

    # Dynamic: only touch harnesses this repo actually uses.
    if [[ ! -d "$parent" ]]; then
      continue
    fi

    if [[ -L "$target" ]]; then
      continue
    fi

    if [[ -d "$target" ]]; then
      echo ">> WARNING: ${link}/skills is a real directory — leaving it unchanged" >&2
      continue
    fi

    # Repair a plain-text stub left behind by `core.symlinks=false`, where git
    # materializes a symlink as a regular file containing its target path.
    if [[ -f "$target" ]]; then
      if [[ "$(cat "$target" 2>/dev/null)" == "../.agents/skills" ]]; then
        rm -f "$target"
      else
        echo ">> WARNING: ${link}/skills exists but is not a symlink — leaving it unchanged" >&2
        continue
      fi
    fi

    if ln -s ../.agents/skills "$target" 2>/dev/null; then
      echo ">> linked ${link}/skills -> ../.agents/skills"
    else
      echo ">> WARNING: could not create ${link}/skills symlink" >&2
      echo ">>          run 'git config core.symlinks true' and re-check out the repo" >&2
    fi
  done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if [[ -n "${HARNESS_AGENTS:-}" ]]; then
  read -r -a HARNESS_LIST <<< "${HARNESS_AGENTS}"
  echo ">> using HARNESS_AGENTS override"
else
  mapfile -t HARNESS_LIST < <(detect_harness_agents)
fi

if [[ ${#HARNESS_LIST[@]} -eq 0 ]]; then
  echo ">> no agent harness detected in ${ROOT} — nothing to sync"
  echo ">> expected at least one of: .agents, .cursor, .opencode, .claude, ..."
  exit 0
fi

AG_ARGS=()
for a in "${HARNESS_LIST[@]}"; do
  AG_ARGS+=(-a "$a")
done

resolve_skills_cmd

echo ">> detected harnesses: ${HARNESS_LIST[*]}"
echo ">> syncing from skills-lock.json"

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
  if ! "${SKILLS_BIN[@]}" add "$src" -y "${AG_ARGS[@]}" "${SK_ARGS[@]}" "${EXTRA[@]}" < /dev/null; then
    echo ">> WARNING: failed to install from $src — continuing with next source" >&2
  fi
done < <(jq -c '.skills | to_entries | group_by([.value.source, .value.sourceType])[] | {source: .[0].value.source, sourceType: .[0].value.sourceType, skills: [.[].key]}' "$LOCK")

ensure_harness_symlinks

echo ">> done"
