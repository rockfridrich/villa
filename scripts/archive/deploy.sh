#!/bin/bash
# Deploy to Digital Ocean
# Usage: ./scripts/deploy.sh [--create|--update|--logs|--status]

set -euo pipefail

# =============================================================================
# Input Validation (Security)
# =============================================================================

# Validate APP_ID format (UUID or hex string from DO)
validate_app_id() {
  local app_id="$1"
  if [[ -z "$app_id" ]]; then
    return 1
  fi
  # DO app IDs are UUIDs (8-4-4-4-12 hex format)
  if [[ ! "$app_id" =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
    return 1
  fi
  return 0
}

# Validate file path exists and is safe
validate_spec_file() {
  local spec_path="$1"

  # Reject shell metacharacters
  if [[ "$spec_path" =~ [\;\|\&\$\`\(\)\{\}\<\>\!] ]]; then
    echo "Error: Spec path contains invalid characters" >&2
    return 1
  fi

  # Reject path traversal
  if [[ "$spec_path" =~ \.\. ]]; then
    echo "Error: Path traversal not allowed" >&2
    return 1
  fi

  # Check file exists
  if [[ ! -f "$spec_path" ]]; then
    echo "Error: Spec file not found: $spec_path" >&2
    return 1
  fi

  return 0
}

# Sanitize output for display
sanitize_output() {
  local input="$1"
  printf '%s' "$input" | tr -d '\000-\010\013-\037\177' | head -c 500
}

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_SPEC=".do/app.yaml"

# =============================================================================
# Preflight Checks
# =============================================================================

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "Error: doctl (Digital Ocean CLI) is not installed"
    echo ""
    echo "Install with:"
    echo "  macOS: brew install doctl"
    echo "  Linux: snap install doctl"
    echo ""
    echo "Then authenticate:"
    echo "  doctl auth init"
    exit 1
fi

# Verify doctl is authenticated
if ! doctl account get &> /dev/null; then
    echo "Error: doctl is not authenticated"
    echo ""
    echo "Run: doctl auth init"
    exit 1
fi

# =============================================================================
# Helper Functions
# =============================================================================

get_app_id() {
  local raw_id
  raw_id=$(doctl apps list --format ID --no-header 2>/dev/null | head -1)

  # Sanitize and validate
  raw_id=$(sanitize_output "$raw_id")

  if validate_app_id "$raw_id"; then
    echo "$raw_id"
  else
    echo ""
  fi
}

# =============================================================================
# Commands
# =============================================================================

cmd_create() {
  local spec_path="${1:-$DEFAULT_SPEC}"

  # Validate spec file
  if ! validate_spec_file "$PROJECT_ROOT/$spec_path"; then
    exit 1
  fi

  echo "Creating new Digital Ocean app..."
  cd "$PROJECT_ROOT"

  if doctl apps create --spec "$spec_path"; then
    echo ""
    echo "App created! It will be available at the URL shown above."
  else
    echo "Error: Failed to create app" >&2
    exit 1
  fi
}

cmd_update() {
  local spec_path="${1:-$DEFAULT_SPEC}"

  # Validate spec file
  if ! validate_spec_file "$PROJECT_ROOT/$spec_path"; then
    exit 1
  fi

  echo "Updating Digital Ocean app..."

  # Get and validate app ID
  local app_id
  app_id=$(get_app_id)

  if [[ -z "$app_id" ]]; then
    echo "Error: No existing app found or invalid app ID"
    echo "Use --create to create a new app."
    exit 1
  fi

  cd "$PROJECT_ROOT"

  if doctl apps update "$app_id" --spec "$spec_path"; then
    echo ""
    echo "App updated! Deployment in progress."
  else
    echo "Error: Failed to update app" >&2
    exit 1
  fi
}

cmd_logs() {
  local app_id
  app_id=$(get_app_id)

  if [[ -z "$app_id" ]]; then
    echo "Error: No existing app found or invalid app ID" >&2
    exit 1
  fi

  doctl apps logs "$app_id" --follow
}

cmd_status() {
  doctl apps list
}

cmd_help() {
  echo "Usage: ./scripts/deploy.sh [command]"
  echo ""
  echo "Commands:"
  echo "  --create [spec]  Create new app on Digital Ocean"
  echo "  --update [spec]  Update existing app (default)"
  echo "  --logs           Follow deployment logs"
  echo "  --status         Show app status"
  echo "  --help           Show this help"
  echo ""
  echo "Spec file defaults to .do/app.yaml"
}

# =============================================================================
# Main
# =============================================================================

# Validate and parse command (whitelist approach)
MODE="${1:-}"

case "$MODE" in
  --create)
    cmd_create "${2:-}"
    ;;
  --update|"")
    cmd_update "${2:-}"
    ;;
  --logs)
    cmd_logs
    ;;
  --status)
    cmd_status
    ;;
  --help|-h)
    cmd_help
    ;;
  *)
    echo "Error: Unknown command: $(sanitize_output "$MODE")" >&2
    echo ""
    cmd_help
    exit 1
    ;;
esac
