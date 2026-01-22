#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="7c344004-cd63-4b10-8479-9991c3923115"
RAILWAY_API="https://backboard.railway.app/graphql/v2"

declare -A SERVICE_CONFIG=(
    ["villa-staging"]="Dockerfile:/api/health"
    ["villa-developers"]="apps/developers/Dockerfile:/"
    ["villa-key-staging"]="apps/key/Dockerfile:/api/health"
)

usage() {
    cat << EOF
Railway Service Configuration

Usage: $0 <command> [options]

Commands:
    list                    List all services and their config
    get <service>           Get service configuration
    set <service>           Update service Dockerfile path
    fix-all                 Fix all services to correct Dockerfile paths
    deploy <service>        Deploy a service after config change

Services:
    villa-staging           → Dockerfile (hub app)
    villa-developers        → apps/developers/Dockerfile
    villa-key-staging       → apps/key/Dockerfile

Environment:
    RAILWAY_TOKEN           Required for API access

Examples:
    $0 list
    $0 set villa-developers
    $0 fix-all
    $0 deploy villa-developers
EOF
    exit 1
}

check_token() {
    if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
        echo -e "${RED}Error: RAILWAY_TOKEN not set${NC}"
        echo "Get token from: https://railway.app/account/tokens"
        echo "Then: export RAILWAY_TOKEN=your_token"
        exit 1
    fi
}

railway_query() {
    local query="$1"
    curl -sf -X POST "$RAILWAY_API" \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$query"
}

get_service_id() {
    local service_name="$1"
    local query=$(cat << EOF
{
    "query": "query { project(id: \"$PROJECT_ID\") { services { edges { node { id name } } } } }"
}
EOF
)
    railway_query "$query" | jq -r ".data.project.services.edges[] | select(.node.name == \"$service_name\") | .node.id"
}

cmd_list() {
    check_token
    echo -e "${BLUE}Railway Services${NC}"
    echo "================"
    
    local query=$(cat << EOF
{
    "query": "query { project(id: \"$PROJECT_ID\") { services { edges { node { id name serviceInstances { edges { node { serviceName latestDeployment { meta } } } } } } } } }"
}
EOF
)
    
    local result=$(railway_query "$query")
    
    echo "$result" | jq -r '.data.project.services.edges[].node | "\(.name)\t\(.id)"' | while read -r line; do
        name=$(echo "$line" | cut -f1)
        id=$(echo "$line" | cut -f2)
        
        expected="${SERVICE_CONFIG[$name]:-unknown}"
        expected_dockerfile=$(echo "$expected" | cut -d: -f1)
        
        echo ""
        echo -e "${YELLOW}$name${NC} ($id)"
        echo -e "  Expected Dockerfile: $expected_dockerfile"
    done
}

cmd_get() {
    local service_name="${1:-}"
    if [[ -z "$service_name" ]]; then
        echo -e "${RED}Error: service name required${NC}"
        usage
    fi
    
    check_token
    
    local service_id=$(get_service_id "$service_name")
    if [[ -z "$service_id" ]]; then
        echo -e "${RED}Error: Service '$service_name' not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Service: $service_name${NC}"
    echo "ID: $service_id"
    
    local query=$(cat << EOF
{
    "query": "query { service(id: \"$service_id\") { name id serviceInstances { edges { node { latestDeployment { id meta status } } } } } }"
}
EOF
)
    
    railway_query "$query" | jq '.data.service'
}

cmd_set() {
    local service_name="${1:-}"
    if [[ -z "$service_name" ]]; then
        echo -e "${RED}Error: service name required${NC}"
        usage
    fi
    
    check_token
    
    local config="${SERVICE_CONFIG[$service_name]:-}"
    if [[ -z "$config" ]]; then
        echo -e "${RED}Error: Unknown service '$service_name'${NC}"
        echo "Known services: ${!SERVICE_CONFIG[*]}"
        exit 1
    fi
    
    local dockerfile=$(echo "$config" | cut -d: -f1)
    local healthcheck=$(echo "$config" | cut -d: -f2)
    
    local service_id=$(get_service_id "$service_name")
    if [[ -z "$service_id" ]]; then
        echo -e "${RED}Error: Service '$service_name' not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Updating $service_name${NC}"
    echo "  Service ID: $service_id"
    echo "  Dockerfile: $dockerfile"
    echo "  Healthcheck: $healthcheck"
    
    local mutation=$(cat << EOF
{
    "query": "mutation { serviceInstanceUpdate(input: { serviceId: \"$service_id\", source: { repo: null }, builder: DOCKERFILE, dockerfilePath: \"$dockerfile\", healthcheckPath: \"$healthcheck\" }) { id } }"
}
EOF
)
    
    local result=$(railway_query "$mutation")
    
    if echo "$result" | jq -e '.data.serviceInstanceUpdate.id' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Configuration updated${NC}"
    else
        echo -e "${RED}✗ Failed to update${NC}"
        echo "$result" | jq '.errors' 2>/dev/null || echo "$result"
        exit 1
    fi
}

cmd_fix_all() {
    check_token
    echo -e "${BLUE}Fixing all service configurations...${NC}"
    
    for service in "${!SERVICE_CONFIG[@]}"; do
        echo ""
        cmd_set "$service" || true
    done
    
    echo ""
    echo -e "${GREEN}All services configured!${NC}"
    echo "Run '$0 deploy <service>' to apply changes"
}

cmd_deploy() {
    local service_name="${1:-}"
    if [[ -z "$service_name" ]]; then
        echo -e "${RED}Error: service name required${NC}"
        usage
    fi
    
    check_token
    
    local service_id=$(get_service_id "$service_name")
    if [[ -z "$service_id" ]]; then
        echo -e "${RED}Error: Service '$service_name' not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Deploying $service_name...${NC}"
    
    local mutation=$(cat << EOF
{
    "query": "mutation { serviceInstanceRedeploy(serviceId: \"$service_id\") { id } }"
}
EOF
)
    
    local result=$(railway_query "$mutation")
    
    if echo "$result" | jq -e '.data.serviceInstanceRedeploy.id' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Deployment triggered${NC}"
        echo "View at: https://railway.com/project/$PROJECT_ID"
    else
        echo -e "${RED}✗ Failed to deploy${NC}"
        echo "$result" | jq '.errors' 2>/dev/null || echo "$result"
        exit 1
    fi
}

main() {
    local cmd="${1:-help}"
    shift || true
    
    case "$cmd" in
        list)       cmd_list "$@" ;;
        get)        cmd_get "$@" ;;
        set)        cmd_set "$@" ;;
        fix-all)    cmd_fix_all "$@" ;;
        deploy)     cmd_deploy "$@" ;;
        help|--help|-h) usage ;;
        *)
            echo -e "${RED}Unknown command: $cmd${NC}"
            usage
            ;;
    esac
}

main "$@"
