#!/bin/bash
# Villa Docker Test Runner
# Runs tests in isolated Docker containers for consistent CI/local results
#
# Usage:
#   ./scripts/run-tests-docker.sh --unit           # Run unit tests
#   ./scripts/run-tests-docker.sh --integration    # Run integration tests
#   ./scripts/run-tests-docker.sh --e2e            # Run E2E tests (4 parallel workers)
#   ./scripts/run-tests-docker.sh --security       # Run security tests
#   ./scripts/run-tests-docker.sh --all            # Run all test suites
#   ./scripts/run-tests-docker.sh --parallel       # Run unit + integration in parallel
#
# Options:
#   --cleanup     Clean up containers and images after tests
#   --verbose     Show full docker-compose output
#   --no-cache    Rebuild images without cache

set -euo pipefail

# Dynamic path detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.test.yml"
BUILD_ARGS=""
RUN_MODE=""
CLEANUP=false
VERBOSE=false

# Detect docker compose command (V2 can be "docker compose" or "docker-compose")
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
elif docker-compose version &>/dev/null; then
    COMPOSE_CMD="docker-compose -f $COMPOSE_FILE"
else
    echo -e "${RED}Error: docker compose is not available${NC}"
    echo "Please install Docker Desktop or Docker Compose V2"
    exit 1
fi

# Usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] [TEST_TYPE]

Test Types:
    --unit              Run unit tests only
    --integration       Run integration tests only
    --e2e               Run E2E tests with Playwright (4 parallel workers)
    --security          Run security tests only
    --all               Run all test suites
    --parallel          Run unit + integration in parallel

Options:
    --cleanup           Clean up containers and images after tests
    --verbose           Show full docker-compose output
    --no-cache          Rebuild images without cache
    -h, --help          Show this help message

Examples:
    $0 --unit                           # Quick unit tests
    $0 --e2e --verbose                  # E2E tests with full output
    $0 --all --cleanup                  # Full test suite + cleanup
    $0 --parallel                       # Fast parallel unit+integration

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            RUN_MODE="unit"
            shift
            ;;
        --integration)
            RUN_MODE="integration"
            shift
            ;;
        --e2e)
            RUN_MODE="e2e"
            shift
            ;;
        --security)
            RUN_MODE="security"
            shift
            ;;
        --all)
            RUN_MODE="all"
            shift
            ;;
        --parallel)
            RUN_MODE="parallel"
            shift
            ;;
        --cleanup)
            CLEANUP=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --no-cache)
            BUILD_ARGS="--no-cache"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}" >&2
            usage
            exit 1
            ;;
    esac
done

# Validate run mode
if [[ -z "$RUN_MODE" ]]; then
    echo -e "${RED}Error: No test type specified${NC}" >&2
    usage
    exit 1
fi

# Banner
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Villa Docker Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Mode: ${GREEN}$RUN_MODE${NC}"
echo -e "Project: $PROJECT_ROOT"
echo ""

# Pre-flight checks
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker is not installed${NC}" >&2
    exit 1
fi

if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
    echo -e "${RED}Error: docker compose is not available${NC}" >&2
    echo "Please install Docker Desktop or Docker Compose V2" >&2
    exit 1
fi

# Cleanup function
cleanup() {
    local exit_code=$?

    if [[ "$CLEANUP" == true ]]; then
        echo -e "\n${YELLOW}Cleaning up test containers...${NC}"
        $COMPOSE_CMD down --volumes --remove-orphans 2>/dev/null || true

        # Remove test images
        docker images | grep 'villa.*test' | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

        echo -e "${GREEN}Cleanup complete${NC}"
    fi

    exit $exit_code
}

trap cleanup EXIT INT TERM

# Build test images
echo -e "${YELLOW}Building test images...${NC}"
if [[ "$VERBOSE" == true ]]; then
    $COMPOSE_CMD build $BUILD_ARGS
else
    $COMPOSE_CMD build $BUILD_ARGS > /dev/null 2>&1
fi
echo -e "${GREEN}✓ Build complete${NC}\n"

# Run tests based on mode
run_tests() {
    local profile=$1
    local description=$2

    echo -e "${BLUE}Running $description...${NC}"

    if [[ "$VERBOSE" == true ]]; then
        $COMPOSE_CMD --profile "$profile" up --abort-on-container-exit --exit-code-from "test-$profile"
    else
        $COMPOSE_CMD --profile "$profile" up --abort-on-container-exit --exit-code-from "test-$profile" 2>&1 | \
            grep -v "Pulling\|Waiting\|Creating\|Starting" || true
    fi

    local result=${PIPESTATUS[0]}

    if [[ $result -eq 0 ]]; then
        echo -e "${GREEN}✓ $description passed${NC}\n"
    else
        echo -e "${RED}✗ $description failed${NC}\n"
        return $result
    fi
}

# Execute tests
case $RUN_MODE in
    unit)
        run_tests "unit" "Unit tests"
        ;;
    integration)
        run_tests "integration" "Integration tests"
        ;;
    e2e)
        echo -e "${BLUE}Running E2E tests with 4 parallel workers...${NC}"
        $COMPOSE_CMD --profile e2e up --abort-on-container-exit --scale test-e2e=4
        result=$?
        if [[ $result -eq 0 ]]; then
            echo -e "${GREEN}✓ E2E tests passed${NC}\n"
        else
            echo -e "${RED}✗ E2E tests failed${NC}\n"
            exit $result
        fi
        ;;
    security)
        run_tests "security" "Security tests"
        ;;
    all)
        echo -e "${BLUE}Running all test suites...${NC}\n"
        run_tests "unit" "Unit tests"
        run_tests "integration" "Integration tests"
        run_tests "security" "Security tests"

        echo -e "${BLUE}Running E2E tests with 4 parallel workers...${NC}"
        $COMPOSE_CMD --profile e2e up --abort-on-container-exit --scale test-e2e=4
        result=$?
        if [[ $result -eq 0 ]]; then
            echo -e "${GREEN}✓ E2E tests passed${NC}\n"
        else
            echo -e "${RED}✗ E2E tests failed${NC}\n"
            exit $result
        fi
        ;;
    parallel)
        echo -e "${BLUE}Running unit + integration tests in parallel...${NC}\n"
        $COMPOSE_CMD --profile unit --profile integration up --abort-on-container-exit &
        wait $!
        result=$?
        if [[ $result -eq 0 ]]; then
            echo -e "${GREEN}✓ Parallel tests passed${NC}\n"
        else
            echo -e "${RED}✗ Parallel tests failed${NC}\n"
            exit $result
        fi
        ;;
esac

# Success
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All tests completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
