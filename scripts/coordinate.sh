#!/bin/bash
# Multi-terminal coordination helper
# Usage: ./scripts/coordinate.sh <command> [args]

set -e

STATE_FILE=".claude/coordination/state.json"
WBS_DIR="specs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure state file exists
ensure_state() {
  if [ ! -f "$STATE_FILE" ]; then
    mkdir -p "$(dirname "$STATE_FILE")"
    echo '{
  "version": 0,
  "feature": null,
  "wbsPath": null,
  "workUnits": {},
  "lockedFiles": {},
  "sharedReadOnly": [],
  "lastUpdated": null
}' > "$STATE_FILE"
  fi
}

# Initialize coordination for a feature
init() {
  local feature="$1"
  local wbs_path="$2"

  if [ -z "$feature" ]; then
    echo -e "${RED}Usage: coordinate.sh init <feature-name> [wbs-path]${NC}"
    exit 1
  fi

  wbs_path="${wbs_path:-$WBS_DIR/${feature}.wbs.md}"

  ensure_state

  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Parse work units from WBS if it exists
  local work_units="{}"
  if [ -f "$wbs_path" ]; then
    # Extract WU-N patterns and their files
    echo -e "${BLUE}Parsing WBS from $wbs_path...${NC}"
    work_units=$(cat "$wbs_path" | grep -E "^### WU-[0-9]+" | while read line; do
      wu_id=$(echo "$line" | grep -oE "WU-[0-9]+")
      echo "\"$wu_id\": {\"status\": \"pending\", \"files\": [], \"dependsOn\": []}"
    done | paste -sd, - | sed 's/^/{/;s/$/}/')

    if [ "$work_units" = "{}" ] || [ -z "$work_units" ]; then
      work_units="{}"
    fi
  fi

  jq --arg feature "$feature" \
     --arg wbs "$wbs_path" \
     --arg now "$now" \
     --argjson wus "$work_units" \
     '.version += 1 | .feature = $feature | .wbsPath = $wbs | .workUnits = $wus | .lockedFiles = {} | .sharedReadOnly = [] | .lastUpdated = $now' \
     "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

  echo -e "${GREEN}✓ Initialized coordination for '$feature'${NC}"
  echo -e "  WBS: $wbs_path"
  status
}

# Claim a work unit
claim() {
  local wu_id="$1"
  local terminal="${2:-$(tty | sed 's/.*\///')}"

  if [ -z "$wu_id" ]; then
    echo -e "${RED}Usage: coordinate.sh claim <WU-ID> [terminal-name]${NC}"
    exit 1
  fi

  ensure_state

  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Check if WU exists and is available
  local current_status=$(jq -r ".workUnits[\"$wu_id\"].status // \"not_found\"" "$STATE_FILE")

  if [ "$current_status" = "not_found" ]; then
    echo -e "${RED}✗ Work unit '$wu_id' not found${NC}"
    exit 1
  fi

  if [ "$current_status" = "in_progress" ]; then
    local owner=$(jq -r ".workUnits[\"$wu_id\"].terminal" "$STATE_FILE")
    echo -e "${RED}✗ Work unit '$wu_id' already claimed by $owner${NC}"
    exit 1
  fi

  if [ "$current_status" = "completed" ]; then
    echo -e "${YELLOW}⚠ Work unit '$wu_id' already completed${NC}"
    exit 0
  fi

  # Check dependencies
  local deps=$(jq -r ".workUnits[\"$wu_id\"].dependsOn[]? // empty" "$STATE_FILE")
  for dep in $deps; do
    local dep_status=$(jq -r ".workUnits[\"$dep\"].status" "$STATE_FILE")
    if [ "$dep_status" != "completed" ]; then
      echo -e "${RED}✗ Cannot claim '$wu_id': depends on '$dep' (status: $dep_status)${NC}"
      exit 1
    fi
  done

  # Claim the work unit
  jq --arg wu "$wu_id" \
     --arg term "$terminal" \
     --arg now "$now" \
     '.version += 1 | .workUnits[$wu].status = "in_progress" | .workUnits[$wu].terminal = $term | .workUnits[$wu].startedAt = $now | .lastUpdated = $now' \
     "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

  echo -e "${GREEN}✓ Claimed '$wu_id' for terminal '$terminal'${NC}"
}

# Lock files for editing
lock() {
  local wu_id="$1"
  shift
  local files=("$@")

  if [ -z "$wu_id" ] || [ ${#files[@]} -eq 0 ]; then
    echo -e "${RED}Usage: coordinate.sh lock <WU-ID> <file1> [file2] ...${NC}"
    exit 1
  fi

  ensure_state

  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local terminal=$(jq -r ".workUnits[\"$wu_id\"].terminal // \"unknown\"" "$STATE_FILE")

  # Check each file
  for file in "${files[@]}"; do
    local existing=$(jq -r ".lockedFiles[\"$file\"].workUnit // \"\"" "$STATE_FILE")
    if [ -n "$existing" ] && [ "$existing" != "$wu_id" ]; then
      echo -e "${RED}✗ File '$file' already locked by $existing${NC}"
      exit 1
    fi

    # Check if file is in sharedReadOnly
    local is_readonly=$(jq -r ".sharedReadOnly | index(\"$file\") // -1" "$STATE_FILE")
    if [ "$is_readonly" != "-1" ]; then
      echo -e "${RED}✗ File '$file' is read-only (shared interface)${NC}"
      exit 1
    fi
  done

  # Lock all files
  for file in "${files[@]}"; do
    jq --arg file "$file" \
       --arg wu "$wu_id" \
       --arg term "$terminal" \
       --arg now "$now" \
       '.version += 1 | .lockedFiles[$file] = {"workUnit": $wu, "terminal": $term, "lockedAt": $now} | .lastUpdated = $now' \
       "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
  done

  echo -e "${GREEN}✓ Locked ${#files[@]} file(s) for $wu_id${NC}"
}

# Check if a file can be edited
check() {
  local file="$1"
  local wu_id="$2"

  if [ -z "$file" ]; then
    echo -e "${RED}Usage: coordinate.sh check <file> [WU-ID]${NC}"
    exit 1
  fi

  ensure_state

  # Check read-only
  local is_readonly=$(jq -r ".sharedReadOnly | index(\"$file\") // -1" "$STATE_FILE")
  if [ "$is_readonly" != "-1" ]; then
    echo -e "${RED}BLOCKED: '$file' is read-only (shared interface)${NC}"
    exit 1
  fi

  # Check lock
  local lock_info=$(jq -r ".lockedFiles[\"$file\"] // empty" "$STATE_FILE")
  if [ -n "$lock_info" ]; then
    local lock_wu=$(echo "$lock_info" | jq -r '.workUnit')
    local lock_term=$(echo "$lock_info" | jq -r '.terminal')

    if [ -n "$wu_id" ] && [ "$lock_wu" = "$wu_id" ]; then
      echo -e "${GREEN}OK: '$file' locked by your work unit ($wu_id)${NC}"
      exit 0
    else
      echo -e "${RED}BLOCKED: '$file' locked by $lock_wu (terminal: $lock_term)${NC}"
      exit 1
    fi
  fi

  echo -e "${GREEN}OK: '$file' is available${NC}"
}

# Complete a work unit
complete() {
  local wu_id="$1"
  local commit_hash="${2:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}"

  if [ -z "$wu_id" ]; then
    echo -e "${RED}Usage: coordinate.sh complete <WU-ID> [commit-hash]${NC}"
    exit 1
  fi

  ensure_state

  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Get files owned by this WU
  local files=$(jq -r ".lockedFiles | to_entries[] | select(.value.workUnit == \"$wu_id\") | .key" "$STATE_FILE")

  # Release locks and mark complete
  jq --arg wu "$wu_id" \
     --arg now "$now" \
     --arg hash "$commit_hash" \
     '.version += 1 | .workUnits[$wu].status = "completed" | .workUnits[$wu].completedAt = $now | .workUnits[$wu].commitHash = $hash | .lastUpdated = $now | .lockedFiles = (.lockedFiles | to_entries | map(select(.value.workUnit != $wu)) | from_entries)' \
     "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

  echo -e "${GREEN}✓ Completed '$wu_id' (commit: ${commit_hash:0:7})${NC}"

  # Check if any blocked WUs are now unblocked
  local blocked=$(jq -r '.workUnits | to_entries[] | select(.value.status == "pending") | .key' "$STATE_FILE")
  for pending_wu in $blocked; do
    local all_deps_done=true
    local deps=$(jq -r ".workUnits[\"$pending_wu\"].dependsOn[]? // empty" "$STATE_FILE")
    for dep in $deps; do
      local dep_status=$(jq -r ".workUnits[\"$dep\"].status" "$STATE_FILE")
      if [ "$dep_status" != "completed" ]; then
        all_deps_done=false
        break
      fi
    done
    if [ "$all_deps_done" = true ] && [ -n "$deps" ]; then
      echo -e "${BLUE}→ '$pending_wu' is now unblocked${NC}"
    fi
  done
}

# Show current status
status() {
  ensure_state

  echo -e "${BLUE}=== Coordination Status ===${NC}"
  echo ""

  local feature=$(jq -r '.feature // "none"' "$STATE_FILE")
  local version=$(jq -r '.version' "$STATE_FILE")
  local last_updated=$(jq -r '.lastUpdated // "never"' "$STATE_FILE")

  echo -e "Feature: ${GREEN}$feature${NC}"
  echo -e "Version: $version"
  echo -e "Updated: $last_updated"
  echo ""

  echo -e "${BLUE}Work Units:${NC}"
  jq -r '.workUnits | to_entries[] | "  \(.key): \(.value.status)\(if .value.terminal then " [\(.value.terminal)]" else "" end)"' "$STATE_FILE"
  echo ""

  local locked_count=$(jq '.lockedFiles | length' "$STATE_FILE")
  if [ "$locked_count" -gt 0 ]; then
    echo -e "${BLUE}Locked Files ($locked_count):${NC}"
    jq -r '.lockedFiles | to_entries[] | "  \(.key) → \(.value.workUnit)"' "$STATE_FILE"
    echo ""
  fi

  local readonly_count=$(jq '.sharedReadOnly | length' "$STATE_FILE")
  if [ "$readonly_count" -gt 0 ]; then
    echo -e "${BLUE}Read-Only Files ($readonly_count):${NC}"
    jq -r '.sharedReadOnly[]' "$STATE_FILE" | sed 's/^/  /'
    echo ""
  fi
}

# Mark files as read-only (shared interfaces)
readonly_add() {
  local files=("$@")

  if [ ${#files[@]} -eq 0 ]; then
    echo -e "${RED}Usage: coordinate.sh readonly <file1> [file2] ...${NC}"
    exit 1
  fi

  ensure_state

  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  for file in "${files[@]}"; do
    jq --arg file "$file" --arg now "$now" \
       '.version += 1 | .sharedReadOnly += [$file] | .sharedReadOnly |= unique | .lastUpdated = $now' \
       "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
  done

  echo -e "${GREEN}✓ Marked ${#files[@]} file(s) as read-only${NC}"
}

# Reset coordination state
reset() {
  ensure_state

  echo '{
  "version": 0,
  "feature": null,
  "wbsPath": null,
  "workUnits": {},
  "lockedFiles": {},
  "sharedReadOnly": [],
  "lastUpdated": null
}' > "$STATE_FILE"

  echo -e "${GREEN}✓ Coordination state reset${NC}"
}

# Main command router
case "${1:-}" in
  init)
    shift
    init "$@"
    ;;
  claim)
    shift
    claim "$@"
    ;;
  lock)
    shift
    lock "$@"
    ;;
  check)
    shift
    check "$@"
    ;;
  complete)
    shift
    complete "$@"
    ;;
  status|"")
    status
    ;;
  readonly)
    shift
    readonly_add "$@"
    ;;
  reset)
    reset
    ;;
  *)
    echo -e "${BLUE}Multi-Terminal Coordination${NC}"
    echo ""
    echo "Usage: ./scripts/coordinate.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  init <feature> [wbs]  Initialize coordination for a feature"
    echo "  claim <WU-ID> [term]  Claim a work unit"
    echo "  lock <WU-ID> <files>  Lock files for editing"
    echo "  check <file> [WU-ID]  Check if file can be edited"
    echo "  complete <WU-ID>      Mark work unit as complete"
    echo "  status                Show current coordination status"
    echo "  readonly <files>      Mark files as read-only"
    echo "  reset                 Reset coordination state"
    ;;
esac
