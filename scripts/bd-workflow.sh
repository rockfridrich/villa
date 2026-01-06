#!/bin/bash
# bd-workflow.sh - Beads integration for Villa's agent orchestration
# Bridges coordinate.sh patterns to Beads commands for persistent task memory
#
# Usage:
#   ./scripts/bd-workflow.sh ready          # Show available work
#   ./scripts/bd-workflow.sh start <id>     # Claim a task
#   ./scripts/bd-workflow.sh done <id>      # Complete a task
#   ./scripts/bd-workflow.sh from-spec <spec-path>  # Import WBS from spec
#   ./scripts/bd-workflow.sh status         # Show all task states

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Ensure bd is installed
check_bd() {
  if ! command -v bd &> /dev/null; then
    echo -e "${RED}Error: bd (Beads) not installed${NC}"
    echo "Install: brew install steveyegge/beads/bd"
    exit 1
  fi
}

# Show tasks ready to work on (no blockers)
ready() {
  check_bd
  echo -e "${BLUE}=== Ready Tasks ===${NC}"
  bd ready --format table 2>/dev/null || bd ready
}

# Claim a task and mark in-progress
start_task() {
  local task_id="$1"
  check_bd

  if [[ -z "$task_id" ]]; then
    echo -e "${RED}Usage: bd-workflow.sh start <task-id>${NC}"
    exit 1
  fi

  # Set actor for audit trail (terminal name or Claude session)
  local actor
  actor=$(tty 2>/dev/null | sed 's/.*\///' || echo "claude")

  # Use --claim for atomic claim (sets assignee + status=in_progress)
  bd update "$task_id" --claim --actor "$actor"
  echo -e "${GREEN}Started: $task_id${NC}"

  # Show task details
  bd show "$task_id"
}

# Complete a task with optional commit reference
done_task() {
  local task_id="$1"
  local commit_hash="${2:-$(git rev-parse --short HEAD 2>/dev/null || echo '')}"
  check_bd

  if [[ -z "$task_id" ]]; then
    echo -e "${RED}Usage: bd-workflow.sh done <task-id> [commit-hash]${NC}"
    exit 1
  fi

  # Add commit reference as comment if provided
  if [[ -n "$commit_hash" ]]; then
    bd comments add "$task_id" "Completed in commit $commit_hash" 2>/dev/null || true
  fi

  bd close "$task_id"
  echo -e "${GREEN}Completed: $task_id${NC}"

  # Show what's now unblocked
  echo ""
  echo -e "${BLUE}Now ready:${NC}"
  bd ready --limit 5
}

# Import work units from a spec file
from_spec() {
  local spec_path="$1"
  check_bd

  if [[ -z "$spec_path" ]] || [[ ! -f "$spec_path" ]]; then
    echo -e "${RED}Usage: bd-workflow.sh from-spec <spec-path>${NC}"
    echo "Example: ./scripts/bd-workflow.sh from-spec specs/sprint-5/sdk-improvements.md"
    exit 1
  fi

  local spec_name
  spec_name=$(basename "$spec_path" .md)

  echo -e "${BLUE}Importing tasks from: $spec_path${NC}"

  # Create epic for the spec
  local epic_id
  epic_id=$(bd create "$spec_name" -p 1 --json 2>/dev/null | jq -r '.id' || bd create "$spec_name" -p 1 | grep -oE 'villa-[a-f0-9]+')
  echo -e "${GREEN}Created epic: $epic_id${NC}"

  # Extract WU-N patterns from spec
  local wu_count=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^###[[:space:]]+WU-([0-9]+)[[:space:]]*[-:]?[[:space:]]*(.+)$ ]]; then
      local wu_num="${BASH_REMATCH[1]}"
      local wu_title="${BASH_REMATCH[2]}"

      # Create subtask under epic
      local subtask_id
      subtask_id=$(bd create "$wu_title" -p 2 --parent "$epic_id" --json 2>/dev/null | jq -r '.id' || \
                   bd create "$wu_title" -p 2 --parent "$epic_id" 2>&1 | grep -oE 'villa-[a-f0-9]+')

      echo -e "  Created WU-$wu_num: $subtask_id - $wu_title"
      ((wu_count++))
    fi
  done < "$spec_path"

  echo -e "${GREEN}Imported $wu_count work units from $spec_name${NC}"
}

# Show overall status
status() {
  check_bd

  echo -e "${BLUE}=== Villa Task Status ===${NC}"
  echo ""

  # Open tasks by priority
  echo -e "${YELLOW}Open Tasks:${NC}"
  bd list --status open --format table 2>/dev/null || bd list --status open

  echo ""

  # In-progress tasks
  echo -e "${YELLOW}In Progress:${NC}"
  bd list --status in-progress --format table 2>/dev/null || bd list --status in-progress

  echo ""

  # Recently closed
  echo -e "${YELLOW}Recently Completed:${NC}"
  bd list --status closed --limit 5 --format table 2>/dev/null || bd list --status closed --limit 5
}

# Create a quick task (for ad-hoc work)
quick() {
  local title="$*"
  check_bd

  if [[ -z "$title" ]]; then
    echo -e "${RED}Usage: bd-workflow.sh quick <task description>${NC}"
    exit 1
  fi

  bd create "$title" -p 2
}

# Show context for Claude session start (inject into prompts)
context() {
  check_bd

  echo "## Current Work (from Beads)"
  echo ""

  local ready_count
  ready_count=$(bd ready --json 2>/dev/null | jq 'length' || echo "0")

  if [[ "$ready_count" != "0" ]]; then
    echo "**Ready to work on:**"
    bd ready --limit 5 --format markdown 2>/dev/null || bd ready --limit 5
    echo ""
  fi

  local in_progress
  in_progress=$(bd list --status in-progress --json 2>/dev/null | jq 'length' || echo "0")

  if [[ "$in_progress" != "0" ]]; then
    echo "**Currently in progress:**"
    bd list --status in-progress --format markdown 2>/dev/null || bd list --status in-progress
    echo ""
  fi
}

# Add dependency between tasks
depend() {
  local child="$1"
  local parent="$2"
  check_bd

  if [[ -z "$child" ]] || [[ -z "$parent" ]]; then
    echo -e "${RED}Usage: bd-workflow.sh depend <child-id> <parent-id>${NC}"
    echo "Child task will be blocked until parent is complete"
    exit 1
  fi

  bd dep add "$child" "$parent"
  echo -e "${GREEN}$child now depends on $parent${NC}"
}

# Main command router
case "${1:-}" in
  ready)
    ready
    ;;
  start)
    shift
    start_task "$@"
    ;;
  done|complete)
    shift
    done_task "$@"
    ;;
  from-spec|import)
    shift
    from_spec "$@"
    ;;
  status)
    status
    ;;
  quick|add)
    shift
    quick "$@"
    ;;
  context)
    context
    ;;
  depend|dep)
    shift
    depend "$@"
    ;;
  help|--help|-h|"")
    echo -e "${BLUE}Villa Beads Workflow${NC}"
    echo ""
    echo "Persistent task memory for parallel agent orchestration."
    echo ""
    echo "Commands:"
    echo "  ready              Show tasks with no blockers"
    echo "  start <id>         Claim task, mark in-progress"
    echo "  done <id>          Complete task, release blockers"
    echo "  from-spec <path>   Import WU-N tasks from spec file"
    echo "  status             Overview of all tasks"
    echo "  quick <title>      Create ad-hoc P2 task"
    echo "  context            Output for Claude session injection"
    echo "  depend <a> <b>     Make task A depend on task B"
    echo ""
    echo "Direct bd commands also work:"
    echo "  bd show <id>       Task details + history"
    echo "  bd note <id> msg   Add note to task"
    echo "  bd list            All tasks"
    echo ""
    echo -e "${YELLOW}Tip: Use 'bd ready' in agent prompts for work discovery${NC}"
    ;;
  *)
    # Pass through to bd directly
    check_bd
    bd "$@"
    ;;
esac
