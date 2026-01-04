#!/bin/bash
# Villa Environment Sync Script
#
# Syncs environment variables between local .env files, GitHub Secrets,
# and DigitalOcean App Platform.
#
# Usage:
#   ./scripts/env-sync.sh pull github        # Pull GitHub secrets to .env.local
#   ./scripts/env-sync.sh push github        # Push .env.local to GitHub Secrets
#   ./scripts/env-sync.sh push do [app]      # Push to DO App Platform
#   ./scripts/env-sync.sh validate           # Validate .env.local completeness
#   ./scripts/env-sync.sh list github        # List GitHub secrets
#   ./scripts/env-sync.sh list do            # List DO app env vars
#   ./scripts/env-sync.sh diff               # Compare local vs GitHub

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env.local"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.example"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Secrets that should be synced (sensitive, not defaults)
SYNC_SECRETS=(
    "DIGITALOCEAN_ACCESS_TOKEN"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
    "DATABASE_URL"
    "DATABASE_POOL_URL"
    "DEPLOYER_PRIVATE_KEY"
    "BASESCAN_API_KEY"
    "ANTHROPIC_API_KEY"
    "MERCHANT_PRIVATE_KEY"
)

# Required for local development
REQUIRED_LOCAL=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_PORTO_ENV"
)

# Required for production
REQUIRED_PROD=(
    "DATABASE_URL"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
)

usage() {
    echo -e "${BLUE}Villa Environment Sync${NC}"
    echo ""
    echo "Usage: $0 <command> [target] [options]"
    echo ""
    echo "Commands:"
    echo "  pull github          Pull secrets from GitHub to .env.local"
    echo "  push github          Push secrets from .env.local to GitHub Secrets"
    echo "  push do [app]        Push env vars to DigitalOcean App Platform"
    echo "  list github          List GitHub Secrets"
    echo "  list do [app]        List DO App Platform env vars"
    echo "  diff                 Compare .env.local with GitHub Secrets"
    echo "  validate             Validate .env.local has required variables"
    echo "  init                 Create .env.local from .env.example"
    echo ""
    echo "Examples:"
    echo "  $0 pull github                    # Get secrets from GitHub"
    echo "  $0 push github                    # Update GitHub secrets"
    echo "  $0 push do villa-production       # Update production app"
    echo "  $0 validate                       # Check for missing vars"
}

# Check dependencies
check_deps() {
    local missing=()

    if ! command -v gh &>/dev/null; then
        missing+=("gh (GitHub CLI)")
    fi

    if ! command -v doctl &>/dev/null; then
        missing+=("doctl (DigitalOcean CLI)")
    fi

    if ! command -v jq &>/dev/null; then
        missing+=("jq (JSON processor)")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Missing dependencies:${NC}"
        for dep in "${missing[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Install with:"
        echo "  brew install gh doctl jq"
        exit 1
    fi
}

# Load .env file into associative array
load_env_file() {
    local file="$1"
    declare -gA ENV_VARS

    if [[ ! -f "$file" ]]; then
        return 1
    fi

    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue

        # Parse KEY=value
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"
            # Remove surrounding quotes if present
            value="${value%\"}"
            value="${value#\"}"
            value="${value%\'}"
            value="${value#\'}"
            ENV_VARS["$key"]="$value"
        fi
    done < "$file"
}

# Pull secrets from GitHub to .env.local
pull_github() {
    echo -e "${BLUE}Pulling secrets from GitHub...${NC}"

    # Check if .env.local exists
    if [[ -f "$ENV_FILE" ]]; then
        echo -e "${YELLOW}Warning: .env.local exists. Secrets will be merged (existing values preserved).${NC}"
        read -p "Continue? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
        load_env_file "$ENV_FILE"
    else
        # Start from example
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        load_env_file "$ENV_FILE"
    fi

    local updated=0

    for secret in "${SYNC_SECRETS[@]}"; do
        # Check if secret exists in GitHub
        if gh secret list | grep -q "^${secret}"; then
            # We can't read the actual value, but we can note it exists
            if [[ -z "${ENV_VARS[$secret]:-}" ]]; then
                echo -e "${YELLOW}  $secret: exists in GitHub (set manually in .env.local)${NC}"
            else
                echo -e "${GREEN}  $secret: already set locally${NC}"
            fi
        else
            echo -e "${CYAN}  $secret: not in GitHub${NC}"
        fi
    done

    echo ""
    echo -e "${YELLOW}Note: GitHub Secrets can't be read, only written.${NC}"
    echo -e "${YELLOW}Copy values manually from your secure storage to .env.local${NC}"
}

# Push secrets to GitHub
push_github() {
    echo -e "${BLUE}Pushing secrets to GitHub...${NC}"

    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        echo "Run: $0 init"
        exit 1
    fi

    load_env_file "$ENV_FILE"

    local pushed=0
    local skipped=0

    for secret in "${SYNC_SECRETS[@]}"; do
        local value="${ENV_VARS[$secret]:-}"

        if [[ -n "$value" ]]; then
            echo -n "  Pushing $secret... "
            if echo "$value" | gh secret set "$secret" 2>/dev/null; then
                echo -e "${GREEN}done${NC}"
                ((pushed++))
            else
                echo -e "${RED}failed${NC}"
            fi
        else
            echo -e "${CYAN}  $secret: skipped (empty)${NC}"
            ((skipped++))
        fi
    done

    echo ""
    echo -e "${GREEN}Pushed: $pushed${NC}, ${CYAN}Skipped: $skipped${NC}"
}

# Push to DigitalOcean App Platform
push_do() {
    local app_name="${1:-}"

    if [[ -z "$app_name" ]]; then
        echo -e "${BLUE}Available apps:${NC}"
        doctl apps list --format Name,ID --no-header
        echo ""
        echo "Usage: $0 push do <app-name>"
        exit 1
    fi

    echo -e "${BLUE}Pushing env vars to DO app: $app_name${NC}"

    # Get app ID
    local app_id
    app_id=$(doctl apps list --format Name,ID --no-header | grep "^${app_name}" | awk '{print $2}')

    if [[ -z "$app_id" ]]; then
        echo -e "${RED}Error: App '$app_name' not found${NC}"
        exit 1
    fi

    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        exit 1
    fi

    load_env_file "$ENV_FILE"

    # Build envs JSON
    local envs="["
    local first=true

    for secret in "${SYNC_SECRETS[@]}"; do
        local value="${ENV_VARS[$secret]:-}"

        if [[ -n "$value" ]]; then
            if [[ "$first" == "false" ]]; then
                envs+=","
            fi
            envs+="{\"key\":\"$secret\",\"value\":\"$value\",\"scope\":\"RUN_AND_BUILD_TIME\",\"type\":\"SECRET\"}"
            first=false
            echo -e "${GREEN}  + $secret${NC}"
        fi
    done

    envs+="]"

    echo ""
    echo -e "${YELLOW}Note: This will update the app spec. Review and deploy manually.${NC}"
    echo "App ID: $app_id"
    echo ""
    echo "To update, run:"
    echo "  doctl apps update $app_id --spec <updated-spec.yaml>"
}

# List GitHub secrets
list_github() {
    echo -e "${BLUE}GitHub Secrets:${NC}"
    gh secret list
}

# List DO app env vars
list_do() {
    local app_name="${1:-}"

    if [[ -z "$app_name" ]]; then
        echo -e "${BLUE}DigitalOcean Apps:${NC}"
        doctl apps list --format Name,ID,DefaultIngress --no-header
        return
    fi

    echo -e "${BLUE}Env vars for: $app_name${NC}"
    doctl apps list --output json | jq -r ".[] | select(.spec.name == \"$app_name\") | .spec.envs // [] | .[] | \"\(.key) = \(.value // \"[SECRET]\")\"" 2>/dev/null || echo "No env vars found"
}

# Compare local vs GitHub
diff_envs() {
    echo -e "${BLUE}Comparing .env.local with GitHub Secrets${NC}"
    echo ""

    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        exit 1
    fi

    load_env_file "$ENV_FILE"

    echo -e "${CYAN}Secret                        Local    GitHub${NC}"
    echo "─────────────────────────────────────────────────"

    for secret in "${SYNC_SECRETS[@]}"; do
        local local_status="${RED}✗${NC}"
        local github_status="${RED}✗${NC}"

        if [[ -n "${ENV_VARS[$secret]:-}" ]]; then
            local_status="${GREEN}✓${NC}"
        fi

        if gh secret list 2>/dev/null | grep -q "^${secret}"; then
            github_status="${GREEN}✓${NC}"
        fi

        printf "%-30s %-8b %-8b\n" "$secret" "$local_status" "$github_status"
    done
}

# Validate .env.local
validate() {
    echo -e "${BLUE}Validating .env.local${NC}"
    echo ""

    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        echo "Run: $0 init"
        exit 1
    fi

    load_env_file "$ENV_FILE"

    local errors=0

    echo -e "${CYAN}Required for local development:${NC}"
    for var in "${REQUIRED_LOCAL[@]}"; do
        if [[ -n "${ENV_VARS[$var]:-}" ]]; then
            echo -e "  ${GREEN}✓${NC} $var"
        else
            echo -e "  ${RED}✗${NC} $var (missing)"
            ((errors++))
        fi
    done

    echo ""
    echo -e "${CYAN}Required for production:${NC}"
    for var in "${REQUIRED_PROD[@]}"; do
        if [[ -n "${ENV_VARS[$var]:-}" ]]; then
            echo -e "  ${GREEN}✓${NC} $var"
        else
            echo -e "  ${YELLOW}○${NC} $var (not set - needed for production)"
        fi
    done

    echo ""
    echo -e "${CYAN}Optional secrets:${NC}"
    for var in "${SYNC_SECRETS[@]}"; do
        # Skip if already listed
        if [[ " ${REQUIRED_LOCAL[*]} " =~ " ${var} " ]] || [[ " ${REQUIRED_PROD[*]} " =~ " ${var} " ]]; then
            continue
        fi

        if [[ -n "${ENV_VARS[$var]:-}" ]]; then
            echo -e "  ${GREEN}✓${NC} $var"
        else
            echo -e "  ${CYAN}○${NC} $var (optional)"
        fi
    done

    echo ""
    if [[ $errors -gt 0 ]]; then
        echo -e "${RED}Validation failed: $errors required variable(s) missing${NC}"
        exit 1
    else
        echo -e "${GREEN}Validation passed!${NC}"
    fi
}

# Initialize .env.local from example
init_env() {
    if [[ -f "$ENV_FILE" ]]; then
        echo -e "${YELLOW}Warning: .env.local already exists${NC}"
        read -p "Overwrite? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi

    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo -e "${GREEN}Created .env.local from .env.example${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env.local with your values"
    echo "  2. Run: $0 validate"
    echo "  3. Run: $0 push github (to sync secrets)"
}

# Main
check_deps

case "${1:-}" in
    pull)
        case "${2:-}" in
            github) pull_github ;;
            *) usage; exit 1 ;;
        esac
        ;;
    push)
        case "${2:-}" in
            github) push_github ;;
            do) push_do "${3:-}" ;;
            *) usage; exit 1 ;;
        esac
        ;;
    list)
        case "${2:-}" in
            github) list_github ;;
            do) list_do "${3:-}" ;;
            *) usage; exit 1 ;;
        esac
        ;;
    diff)
        diff_envs
        ;;
    validate)
        validate
        ;;
    init)
        init_env
        ;;
    *)
        usage
        exit 1
        ;;
esac
