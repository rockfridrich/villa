#!/bin/bash
# CI Monitor - Non-blocking GitHub Actions monitoring
# Runs in background, tracks status via Beads, alerts on failure
#
# Usage: ./scripts/ci-monitor.sh [--watch] [--beads]
#   --watch: Keep monitoring until completion
#   --beads: Create/update Beads task with status

set -euo pipefail

LOG_FILE=".claude/ci-status.log"
BEADS_ENABLED=false
WATCH_MODE=false

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --watch) WATCH_MODE=true; shift ;;
    --beads) BEADS_ENABLED=true; shift ;;
    *) shift ;;
  esac
done

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Get latest workflow run for current branch
get_latest_run() {
  local branch
  branch=$(git branch --show-current 2>/dev/null || echo "main")
  gh run list --branch "$branch" --limit 1 --json databaseId,status,conclusion,workflowName,createdAt -q '.[0]' 2>/dev/null || echo '{}'
}

# Parse run status
get_status() {
  local run=$1
  local status conclusion
  status=$(echo "$run" | jq -r '.status // "unknown"')
  conclusion=$(echo "$run" | jq -r '.conclusion // "pending"')

  if [[ "$status" == "completed" ]]; then
    echo "$conclusion"
  elif [[ "$status" == "in_progress" || "$status" == "queued" ]]; then
    echo "running"
  else
    echo "unknown"
  fi
}

# Update Beads task (if enabled)
update_beads() {
  local status=$1
  local run_id=$2

  if [[ "$BEADS_ENABLED" != "true" ]]; then
    return
  fi

  # Create or update CI monitoring task in Beads
  # Format: bd create "CI: <status>" --type monitor
  case $status in
    success)
      log "✅ Beads: CI passed"
      ;;
    failure)
      log "❌ Beads: CI failed - run $run_id"
      ;;
    running)
      log "🔄 Beads: CI running - run $run_id"
      ;;
  esac
}

# Alert on failure
alert_failure() {
  local run_id=$1
  local workflow=$2

  # Terminal bell
  printf '\a'

  # Log to learnings for pattern recognition
  local learn_file=".claude/LEARNINGS.md"
  if [[ -f "$learn_file" ]]; then
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M')
    echo "" >> "$learn_file"
    echo "### CI Failure - $timestamp" >> "$learn_file"
    echo "- Workflow: $workflow" >> "$learn_file"
    echo "- Run: https://github.com/rockfridrich/villa/actions/runs/$run_id" >> "$learn_file"
    echo "- Action: Check \`gh run view $run_id --log-failed\`" >> "$learn_file"
  fi

  log "⚠️  CI FAILED - Check: gh run view $run_id --log-failed"
}

# Main monitoring loop
monitor() {
  log "Starting CI monitor..."

  local run run_id status workflow last_status=""

  while true; do
    run=$(get_latest_run)

    if [[ -z "$run" || "$run" == "{}" ]]; then
      log "No workflow runs found"
      [[ "$WATCH_MODE" == "true" ]] || break
      sleep 30
      continue
    fi

    run_id=$(echo "$run" | jq -r '.databaseId')
    workflow=$(echo "$run" | jq -r '.workflowName')
    status=$(get_status "$run")

    # Only log on status change
    if [[ "$status" != "$last_status" ]]; then
      case $status in
        success)
          log "✅ $workflow #$run_id: PASSED"
          update_beads "success" "$run_id"
          ;;
        failure)
          log "❌ $workflow #$run_id: FAILED"
          alert_failure "$run_id" "$workflow"
          update_beads "failure" "$run_id"
          ;;
        running)
          log "🔄 $workflow #$run_id: Running..."
          update_beads "running" "$run_id"
          ;;
        *)
          log "❓ $workflow #$run_id: $status"
          ;;
      esac
      last_status="$status"
    fi

    # Exit if completed and not in watch mode
    if [[ "$status" == "success" || "$status" == "failure" ]] && [[ "$WATCH_MODE" != "true" ]]; then
      break
    fi

    # Wait before next check
    [[ "$WATCH_MODE" == "true" ]] && sleep 30 || break
  done

  log "CI monitor complete. Status: $status"
  [[ "$status" == "success" ]] && exit 0 || exit 1
}

# Quick status check (non-blocking)
quick_status() {
  local run status
  run=$(get_latest_run)

  if [[ -z "$run" || "$run" == "{}" ]]; then
    echo "No recent CI runs"
    return 0
  fi

  local run_id workflow created
  run_id=$(echo "$run" | jq -r '.databaseId')
  workflow=$(echo "$run" | jq -r '.workflowName')
  created=$(echo "$run" | jq -r '.createdAt')
  status=$(get_status "$run")

  case $status in
    success)  echo "✅ $workflow: passed ($created)" ;;
    failure)  echo "❌ $workflow: FAILED ($created) - gh run view $run_id" ;;
    running)  echo "🔄 $workflow: running ($created)" ;;
    *)        echo "❓ $workflow: $status ($created)" ;;
  esac
}

# Entry point
if [[ "$WATCH_MODE" == "true" ]]; then
  monitor
else
  quick_status
fi
