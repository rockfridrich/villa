#!/usr/bin/env bash
# Fix Railway auto-deploy by configuring repo triggers
# Usage: RAILWAY_TOKEN=xxx ./scripts/fix-railway-autodeploy.sh [--check-only|--apply|--verify]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="7c344004-cd63-4b10-8479-9991c3923115"
RAILWAY_API="https://backboard.railway.app/graphql/v2"
REPO_OWNER="rockfridrich"
REPO_NAME="villa"
BRANCH_NAME="main"

# Service configuration - villa-production service ID
VILLA_PRODUCTION_SERVICE_ID="1c25828b-4678-4723-8cb5-8777312584a8"

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Install with: brew install jq"
        exit 1
    fi
}

check_token() {
    if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
        log_error "RAILWAY_TOKEN not set"
        echo "Get token from: https://railway.app/account/tokens"
        echo "Then: export RAILWAY_TOKEN=your_token"
        exit 1
    fi
}

railway_query() {
    local query="$1"
    local response
    local status
    
    response=$(curl -s -w "%{http_code}" -X POST "$RAILWAY_API" \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$query")
    
    status="${response: -3}"
    response="${response%???}"
    
    if [[ "$status" -ne 200 ]]; then
        log_error "Railway API request failed with status $status"
        log_error "Response: $response"
        exit 1
    fi
    
    # Check for GraphQL errors
    local errors
    errors=$(echo "$response" | jq -r '.errors // empty' 2>/dev/null)
    if [[ -n "$errors" && "$errors" != "null" ]]; then
        log_error "Railway API returned errors: $errors"
        exit 1
    fi
    
    echo "$response"
}

get_all_services() {
    log_info "Fetching all services for project $PROJECT_ID..."
    
    local query=$(cat << EOF
{
    "query": "query { project(id: \"$PROJECT_ID\") { services { edges { node { id name } } } } }"
}
EOF
)
    
    railway_query "$query" | jq -r '.data.project.services.edges[].node | "\(.name):\(.id)"'
}

get_service_triggers() {
    local service_id="$1"
    local service_name="$2"
    
    log_info "Checking triggers for $service_name ($service_id)..."
    
    local query=$(cat << EOF
{
    "query": "query { service(id: \"$service_id\") { name id repoTriggers { edges { node { branch repository } } } } }"
}
EOF
)
    
    railway_query "$query"
}

add_repo_trigger() {
    local service_id="$1" 
    local service_name="$2"
    
    log_info "Adding repo trigger for $service_name..."
    
    local mutation=$(cat << EOF
{
    "query": "mutation { serviceConnect(id: \"$service_id\", input: { branch: \"$BRANCH_NAME\", repo: \"$REPO_OWNER/$REPO_NAME\" }) { id } }"
}
EOF
)
    
    local result=$(railway_query "$mutation")
    
    if echo "$result" | jq -e '.data.serviceConnect.id' > /dev/null 2>&1; then
        log_success "✓ Repo trigger added for $service_name"
        return 0
    else
        log_error "✗ Failed to add repo trigger for $service_name"
        echo "$result" | jq '.data' 2>/dev/null || echo "$result"
        return 1
    fi
}

cmd_check_only() {
    log_info "=== Railway Auto-Deploy Status Check ==="
    echo ""
    
    # Get all services to find correct IDs
    log_info "Services in project:"
    get_all_services
    echo ""
    
    # Check each production service
    local issues_found=0
    
    # Focus on villa-production service (ID known from task)
    local service_id="$VILLA_PRODUCTION_SERVICE_ID"
    local service_name="villa-production"
    
    log_info "Checking $service_name..."
    local triggers_result
    triggers_result=$(get_service_triggers "$service_id" "$service_name")
    
    local triggers
    triggers=$(echo "$triggers_result" | jq -r '.data.service.repoTriggers.edges[]?.node | "\(.repository) (\(.branch))"' 2>/dev/null || echo "")
    
    if [[ -z "$triggers" ]]; then
        log_error "✗ No repo triggers configured for $service_name"
        issues_found=1
    else
        log_success "✓ Repo triggers found for $service_name:"
        echo "$triggers" | while read -r trigger; do
            echo "    - $trigger"
        done
        
        # Check if our specific repo/branch is configured
        local our_trigger="${REPO_OWNER}/${REPO_NAME} (${BRANCH_NAME})"
        if echo "$triggers" | grep -q "$our_trigger"; then
            log_success "✓ Target trigger configured: $our_trigger"
        else
            log_warn "⚠ Target trigger missing: $our_trigger"
            log_warn "  Found triggers: $triggers"
            issues_found=1
        fi
    fi
    
    echo ""
    if [[ $issues_found -eq 0 ]]; then
        log_success "=== No issues found ==="
    else
        log_warn "=== Issues found - run with --apply to fix ==="
    fi
    
    return $issues_found
}

cmd_apply() {
    log_info "=== Applying Railway Auto-Deploy Fix ==="
    echo ""
    
    # Focus on villa-production service
    local service_id="$VILLA_PRODUCTION_SERVICE_ID"
    local service_name="villa-production"
    
    log_info "Configuring auto-deploy for $service_name..."
    
    # Check current state
    local triggers_result
    triggers_result=$(get_service_triggers "$service_id" "$service_name")
    
    local existing_triggers
    existing_triggers=$(echo "$triggers_result" | jq -r '.data.service.repoTriggers.edges[]?.node | "\(.repository) (\(.branch))"' 2>/dev/null || echo "")
    
    local our_trigger="${REPO_OWNER}/${REPO_NAME} (${BRANCH_NAME})"
    
    if echo "$existing_triggers" | grep -q "$our_trigger"; then
        log_success "✓ Repo trigger already configured: $our_trigger"
    else
        log_info "Adding repo trigger: $our_trigger"
        if add_repo_trigger "$service_id" "$service_name"; then
            log_success "✓ Auto-deploy configured for $service_name"
        else
            log_error "✗ Failed to configure auto-deploy for $service_name"
            return 1
        fi
    fi
    
    echo ""
    log_success "=== Auto-deploy fix applied ==="
    echo ""
    echo "Next steps:"
    echo "1. Push a change to main branch to test auto-deploy"
    echo "2. Check Railway dashboard: https://railway.com/project/$PROJECT_ID"
    echo "3. Verify with: $0 --verify"
}

cmd_verify() {
    log_info "=== Verifying Railway Auto-Deploy Fix ==="
    echo ""
    
    # Check current configuration
    if cmd_check_only; then
        log_success "✓ Auto-deploy configuration verified"
        
        echo ""
        log_info "Testing auto-deploy..."
        echo "To test that auto-deploy works:"
        echo "1. Make a small change and push to main"
        echo "2. Check Railway dashboard for new deployment"
        echo "3. Verify deployment completes successfully"
        echo ""
        echo "Dashboard: https://railway.com/project/$PROJECT_ID/service/1c25828b"
        
        return 0
    else
        log_error "✗ Auto-deploy configuration issues detected"
        echo "Run: $0 --apply"
        return 1
    fi
}

usage() {
    cat << EOF
Railway Auto-Deploy Fix Script

This script fixes Railway auto-deploy by configuring repository triggers
for the villa-production service to automatically deploy on pushes to main.

Usage: RAILWAY_TOKEN=xxx $0 [command]

Commands:
    --check-only    Check current auto-deploy status (default)
    --apply         Apply the auto-deploy fix
    --verify        Verify the fix is working
    --help          Show this help

Environment:
    RAILWAY_TOKEN   Required - get from https://railway.app/account/tokens

Examples:
    # Check status
    RAILWAY_TOKEN=xxx $0 --check-only
    
    # Apply fix
    RAILWAY_TOKEN=xxx $0 --apply
    
    # Verify fix
    RAILWAY_TOKEN=xxx $0 --verify

Target Service:
    villa-production (1c25828b) → villa.cash
    Repository: $REPO_OWNER/$REPO_NAME
    Branch: $BRANCH_NAME
EOF
}

main() {
    local cmd="${1:---check-only}"
    
    case "$cmd" in
        --check-only)   
            check_dependencies
            check_token
            cmd_check_only 
            ;;
        --apply)        
            check_dependencies
            check_token
            cmd_apply 
            ;;
        --verify)       
            check_dependencies
            check_token
            cmd_verify 
            ;;
        --help|-h|help) 
            usage 
            ;;
        *)
            log_error "Unknown command: $cmd"
            usage
            exit 1
            ;;
    esac
}

main "$@"