#!/usr/bin/env bash
# Create skills-lock.json from installed project skills when it is missing.
# If the lock already exists, offer a small editor for source/sourceType/skillPath.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK="${ROOT}/skills-lock.json"
TMP_LOCK="${LOCK}.tmp.$$"

SUPPORTED_SOURCE_TYPES=(github gitlab git local well-known)

declare -A KNOWN_SOURCES=(
  [cloudflare]="cloudflare/skills"
  [gh-cli]="github/awesome-copilot"
  [hono]="yusukebe/hono-skill"
  [mcporter]="steipete/clawdis"
  [react-devtools]="callstackincubator/agent-react-devtools"
  [skill-creator]="anthropics/skills"
  [webauthx]="wevm/webauthx"
)

declare -A KNOWN_SOURCE_TYPES=(
  [cloudflare]="github"
  [gh-cli]="github"
  [hono]="github"
  [mcporter]="github"
  [react-devtools]="github"
  [skill-creator]="github"
  [webauthx]="github"
)

declare -A KNOWN_SKILL_PATHS=(
  [cloudflare]="skills/cloudflare/SKILL.md"
  [webauthx]="SKILL.md"
)

cleanup() {
  rm -f "$TMP_LOCK"
}
trap cleanup EXIT

die() {
  echo ">> ERROR: $*" >&2
  exit 1
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    die "install jq to run this script"
  fi
}

is_supported_source_type() {
  local value="$1"
  local source_type
  for source_type in "${SUPPORTED_SOURCE_TYPES[@]}"; do
    if [[ "$source_type" == "$value" ]]; then
      return 0
    fi
  done
  return 1
}

write_lock_atomically() {
  local jq_filter="$1"
  shift
  if ! jq "$@" "$jq_filter" "$LOCK" > "$TMP_LOCK"; then
    rm -f "$TMP_LOCK"
    return 1
  fi
  mv "$TMP_LOCK" "$LOCK"
}

skill_exists_in_lock() {
  local skill="$1"
  jq -e --arg skill "$skill" '.skills | type == "object" and has($skill)' "$LOCK" >/dev/null
}

print_supported_source_types() {
  local joined=""
  local source_type
  for source_type in "${SUPPORTED_SOURCE_TYPES[@]}"; do
    if [[ -n "$joined" ]]; then
      joined+=", "
    fi
    joined+="$source_type"
  done
  echo "$joined"
}

edit_existing_lock() {
  require_jq

  if ! jq -e '.version and (.skills | type == "object")' "$LOCK" >/dev/null; then
    die "$LOCK is not a valid skills lock with a skills object"
  fi

  echo ">> $LOCK already exists"

  while true; do
    echo ">> Choose an action:"
    echo "   1) edit a skill entry"
    echo "   2) quit without changes"
    read -r -p "> action [1-2]: " action || return 0

    case "$action" in
      2|q|quit|Q)
        echo ">> leaving $LOCK unchanged"
        return 0
        ;;
      1|e|edit|E)
        ;;
      *)
        echo ">> unsupported action: $action" >&2
        continue
        ;;
    esac

    mapfile -t lock_skills < <(jq -r '.skills | keys[]' "$LOCK" | sort)
    if [[ ${#lock_skills[@]} -eq 0 ]]; then
      echo ">> no skill entries found in $LOCK" >&2
      continue
    fi

    echo ">> Existing skill entries:"
    local i
    for i in "${!lock_skills[@]}"; do
      local skill="${lock_skills[$i]}"
      local source source_type skill_path
      source="$(jq -r --arg skill "$skill" '.skills[$skill].source // ""' "$LOCK")"
      source_type="$(jq -r --arg skill "$skill" '.skills[$skill].sourceType // ""' "$LOCK")"
      skill_path="$(jq -r --arg skill "$skill" '.skills[$skill].skillPath // ""' "$LOCK")"
      printf '   %d) %s  source=%s  sourceType=%s  skillPath=%s\n' "$((i + 1))" "$skill" "$source" "$source_type" "${skill_path:-<unset>}"
    done

    local selected
    read -r -p "> skill name or number: " selected || return 0
    local selected_skill=""
    if [[ "$selected" =~ ^[0-9]+$ ]] && (( selected >= 1 && selected <= ${#lock_skills[@]} )); then
      selected_skill="${lock_skills[$((selected - 1))]}"
    elif skill_exists_in_lock "$selected"; then
      selected_skill="$selected"
    else
      echo ">> unknown skill entry: $selected" >&2
      continue
    fi

    echo ">> Edit field for $selected_skill:"
    echo "   1) source"
    echo "   2) sourceType"
    echo "   3) skillPath"
    echo "   4) cancel"
    local field_choice
    read -r -p "> field [1-4]: " field_choice || return 0

    case "$field_choice" in
      1|source)
        local new_source
        read -r -p "> new source: " new_source || return 0
        if [[ -z "$new_source" ]]; then
          echo ">> source cannot be empty" >&2
          continue
        fi
        write_lock_atomically '.skills[$skill].source = $value' --arg skill "$selected_skill" --arg value "$new_source" || die "failed to update source"
        echo ">> updated $selected_skill.source"
        ;;
      2|sourceType)
        local new_source_type
        read -r -p "> new sourceType ($(print_supported_source_types)): " new_source_type || return 0
        if ! is_supported_source_type "$new_source_type"; then
          echo ">> unsupported sourceType: $new_source_type" >&2
          echo ">> supported sourceTypes: $(print_supported_source_types)" >&2
          continue
        fi
        write_lock_atomically '.skills[$skill].sourceType = $value' --arg skill "$selected_skill" --arg value "$new_source_type" || die "failed to update sourceType"
        echo ">> updated $selected_skill.sourceType"
        ;;
      3|skillPath)
        local new_skill_path
        read -r -p "> new skillPath (empty removes field): " new_skill_path || return 0
        if [[ -z "$new_skill_path" ]]; then
          write_lock_atomically 'del(.skills[$skill].skillPath)' --arg skill "$selected_skill" || die "failed to remove skillPath"
          echo ">> removed $selected_skill.skillPath"
        else
          write_lock_atomically '.skills[$skill].skillPath = $value' --arg skill "$selected_skill" --arg value "$new_skill_path" || die "failed to update skillPath"
          echo ">> updated $selected_skill.skillPath"
        fi
        ;;
      4|c|cancel|C)
        echo ">> edit cancelled"
        ;;
      *)
        echo ">> unsupported field choice: $field_choice" >&2
        ;;
    esac
  done
}

discover_with_skills_cli() {
  local cli_json
  if ! cli_json="$(npx skills list --json 2>/dev/null)"; then
    return 1
  fi
  printf '%s\n' "$cli_json" | jq -r '.[] | select(.scope == "project") | .name' 2>/dev/null | sort -u
}

discover_from_agents_dir() {
  local skills_dir="${ROOT}/.agents/skills"
  [[ -d "$skills_dir" ]] || return 0

  local skill_file name
  for skill_file in "$skills_dir"/*/SKILL.md; do
    [[ -f "$skill_file" ]] || continue
    name="$(awk -F': *' '/^name:/{print $2; exit}' "$skill_file" | tr -d '"' | tr -d "'")"
    if [[ -n "$name" ]]; then
      printf '%s\n' "$name"
    fi
  done | sort -u
}

skip_reason_for_skill() {
  local skill="$1"
  if [[ "$skill" == openspec-* ]]; then
    echo "OpenSpec skills are generated by openspec update"
  elif [[ "$skill" == "pencil-design" ]]; then
    echo "pencil-design is copied from @pencil.dev/cli SKILL.md, not npx skills add"
  else
    echo "no known npx skills add compatible source mapping"
  fi
}

generate_lock() {
  require_jq

  local discovered=()
  mapfile -t discovered < <(discover_with_skills_cli)
  if [[ ${#discovered[@]} -eq 0 ]]; then
    mapfile -t discovered < <(discover_from_agents_dir)
  fi

  if [[ ${#discovered[@]} -eq 0 ]]; then
    die "no installed project skills found via npx skills or .agents/skills"
  fi

  local generated='{"version":1,"skills":{}}'
  local created=()
  local skipped=()
  local skill

  for skill in "${discovered[@]}"; do
    if [[ -n "${KNOWN_SOURCES[$skill]:-}" ]]; then
      local source="${KNOWN_SOURCES[$skill]}"
      local source_type="${KNOWN_SOURCE_TYPES[$skill]}"
      if ! is_supported_source_type "$source_type"; then
        die "known source map has unsupported sourceType for $skill: $source_type"
      fi

      if [[ -n "${KNOWN_SKILL_PATHS[$skill]:-}" ]]; then
        generated="$(printf '%s\n' "$generated" | jq \
          --arg skill "$skill" \
          --arg source "$source" \
          --arg sourceType "$source_type" \
          --arg skillPath "${KNOWN_SKILL_PATHS[$skill]}" \
          '.skills[$skill] = {source: $source, sourceType: $sourceType, skillPath: $skillPath}')"
      else
        generated="$(printf '%s\n' "$generated" | jq \
          --arg skill "$skill" \
          --arg source "$source" \
          --arg sourceType "$source_type" \
          '.skills[$skill] = {source: $source, sourceType: $sourceType}')"
      fi
      created+=("$skill")
    else
      skipped+=("$skill: $(skip_reason_for_skill "$skill")")
    fi
  done

  printf '%s\n' "$generated" | jq --sort-keys '.' > "$TMP_LOCK" || die "failed to build lock JSON"
  mv "$TMP_LOCK" "$LOCK"

  echo ">> created $LOCK"
  echo ">> entries: ${#created[@]}"
  for skill in "${created[@]}"; do
    echo "   + $skill"
  done

  if [[ ${#skipped[@]} -eq 0 ]]; then
    echo ">> skipped: none"
  else
    echo ">> skipped: ${#skipped[@]}"
    for skill in "${skipped[@]}"; do
      echo "   - $skill"
    done
  fi
}

main() {
  cd "$ROOT" || die "failed to enter repo root: $ROOT"

  if [[ -f "$LOCK" ]]; then
    edit_existing_lock
  else
    generate_lock
  fi
}

main "$@"
