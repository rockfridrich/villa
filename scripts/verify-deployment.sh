#!/usr/bin/env bash

# Villa Deployment Verification Script
# Verifies that deployed services have the correct build SHA

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default services
SERVICES=("hub" "key" "developers")

# Function to get endpoint URL for a service
get_endpoint_url() {
    local service=$1
    local env=${2:-production}
    
    case "$service" in
        "hub")
            if [[ "$env" == "construction" ]]; then
                echo "https://construction.villa.cash/api/health"
            else
                echo "https://villa.cash/api/health"
            fi
            ;;
        "key")
            echo "https://key.villa.cash/api/health"
            ;;
        "developers")
            echo "https://docs.villa.cash/api/health"
            ;;
        *)
            echo ""
            ;;
    esac
}

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -s, --sha SHA        Expected git SHA (defaults to current HEAD)"
    echo "  -e, --env ENV        Environment (production, construction)"
    echo "  -S, --service SERVICE Only check specific service (hub, key, developers)"
    echo "  -t, --timeout SECONDS Request timeout (default: 10)"
    echo "  -v, --verbose        Verbose output"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                  # Check all services with current SHA"
    echo "  $0 -s abc123 -S hub                # Check only hub service with specific SHA"
    echo "  $0 -e construction                 # Check construction environment"
}

# Parse command line arguments
EXPECTED_SHA=""
ENVIRONMENT="production"
CHECK_SERVICES=("${SERVICES[@]}")
TIMEOUT=10
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--sha)
            EXPECTED_SHA="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -S|--service)
            CHECK_SERVICES=("$2")
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done



# Get expected SHA if not provided
if [[ -z "$EXPECTED_SHA" ]]; then
    if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
        EXPECTED_SHA=$(git rev-parse HEAD)
        echo -e "${YELLOW}Using current git HEAD SHA: ${EXPECTED_SHA:0:8}${NC}"
    else
        echo -e "${RED}No SHA provided and not in a git repository${NC}"
        exit 1
    fi
fi

# Truncate SHA for display
SHORT_SHA="${EXPECTED_SHA:0:8}"

echo "Verifying deployment SHA: $SHORT_SHA"
echo "Environment: $ENVIRONMENT"
echo "Services: ${CHECK_SERVICES[*]}"
echo ""

# Function to check a single service
check_service() {
    local service=$1
    local url=$(get_endpoint_url "$service" "$ENVIRONMENT")
    
    if [[ -z "$url" ]]; then
        echo -e "${RED}✗ $service: Unknown service${NC}"
        return 1
    fi
    
    if [[ "$VERBOSE" == true ]]; then
        echo "Checking $service at $url..."
    fi
    
    # Make request with timeout
    local response
    if ! response=$(curl -s --max-time "$TIMEOUT" --fail "$url" 2>/dev/null); then
        echo -e "${RED}✗ $service: Health endpoint unreachable${NC}"
        return 1
    fi
    
    # Parse JSON response
    local actual_sha
    local service_name
    local version
    local build_time
    local branch
    
    if ! actual_sha=$(echo "$response" | jq -r '.build.sha // empty' 2>/dev/null); then
        echo -e "${RED}✗ $service: Invalid JSON response${NC}"
        return 1
    fi
    
    if [[ -z "$actual_sha" || "$actual_sha" == "null" ]]; then
        echo -e "${RED}✗ $service: No SHA in response${NC}"
        return 1
    fi
    
    # Get additional info if verbose
    if [[ "$VERBOSE" == true ]]; then
        service_name=$(echo "$response" | jq -r '.service // "unknown"' 2>/dev/null)
        version=$(echo "$response" | jq -r '.version // "unknown"' 2>/dev/null)
        build_time=$(echo "$response" | jq -r '.build.timestamp // "unknown"' 2>/dev/null)
        branch=$(echo "$response" | jq -r '.build.branch // "unknown"' 2>/dev/null)
    fi
    
    # Compare SHAs
    local actual_short="${actual_sha:0:8}"
    
    if [[ "$actual_sha" == "$EXPECTED_SHA" ]]; then
        if [[ "$VERBOSE" == true ]]; then
            echo -e "${GREEN}✓ $service: SHA matches ($actual_short)${NC}"
            echo "  Service: $service_name"
            echo "  Version: $version" 
            echo "  Branch: $branch"
            echo "  Built: $build_time"
        else
            echo -e "${GREEN}✓ $service: $actual_short${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ $service: SHA mismatch${NC}"
        echo "  Expected: $SHORT_SHA"
        echo "  Actual:   $actual_short"
        if [[ "$VERBOSE" == true ]]; then
            echo "  Version: $version"
            echo "  Branch: $branch"
            echo "  Built: $build_time"
        fi
        return 1
    fi
}

# Check all services
failed_services=()
for service in "${CHECK_SERVICES[@]}"; do
    if ! check_service "$service"; then
        failed_services+=("$service")
    fi
done

# Summary
echo ""
if [[ ${#failed_services[@]} -eq 0 ]]; then
    echo -e "${GREEN}✓ All services verified successfully${NC}"
    exit 0
else
    echo -e "${RED}✗ ${#failed_services[@]} service(s) failed verification: ${failed_services[*]}${NC}"
    exit 1
fi