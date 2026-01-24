#!/bin/bash
# Verify Docker Test Infrastructure Setup
# Runs pre-flight checks to ensure Docker test infrastructure is ready

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Villa Docker Test Infrastructure Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

ERRORS=0
WARNINGS=0

# Check 1: Docker installed
echo -n "Checking Docker installation... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓${NC} ($DOCKER_VERSION)"
else
    echo -e "${RED}✗${NC}"
    echo "  Error: docker is not installed"
    ((ERRORS++))
fi

# Check 2: Docker Compose V2
echo -n "Checking Docker Compose... "
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $4}')
    echo -e "${GREEN}✓${NC} ($COMPOSE_VERSION)"
else
    echo -e "${RED}✗${NC}"
    echo "  Error: docker compose is not available"
    echo "  Try: brew install docker-compose or upgrade Docker Desktop"
    ((ERRORS++))
fi

# Check 3: Docker memory
echo -n "Checking Docker memory... "
DOCKER_MEM=$(docker info 2>/dev/null | grep "Total Memory" | awk '{print $3}' | sed 's/GiB//')
if [[ -n "$DOCKER_MEM" ]]; then
    if (( $(echo "$DOCKER_MEM >= 8" | bc -l) )); then
        echo -e "${GREEN}✓${NC} (${DOCKER_MEM}GB available)"
    else
        echo -e "${YELLOW}⚠${NC} (${DOCKER_MEM}GB available)"
        echo "  Warning: Recommended 8GB+ for full test suite"
        echo "  Docker Desktop → Settings → Resources → Memory"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} (unable to determine)"
    ((WARNINGS++))
fi

# Check 4: BuildKit support
echo -n "Checking BuildKit support... "
if docker buildx version &> /dev/null 2>&1; then
    BUILDX_VERSION=$(docker buildx version | awk '{print $2}')
    echo -e "${GREEN}✓${NC} ($BUILDX_VERSION)"
else
    echo -e "${YELLOW}⚠${NC}"
    echo "  Warning: BuildKit not available (slower builds)"
    echo "  Consider upgrading Docker Desktop"
    ((WARNINGS++))
fi

# Check 5: Required files exist
echo -n "Checking Dockerfile.test... "
if [[ -f "Dockerfile.test" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  Error: Dockerfile.test not found"
    ((ERRORS++))
fi

echo -n "Checking docker-compose.test.yml... "
if [[ -f "docker-compose.test.yml" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  Error: docker-compose.test.yml not found"
    ((ERRORS++))
fi

echo -n "Checking run-tests-docker.sh... "
if [[ -x "scripts/run-tests-docker.sh" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  Error: scripts/run-tests-docker.sh not found or not executable"
    echo "  Fix: chmod +x scripts/run-tests-docker.sh"
    ((ERRORS++))
fi

# Check 6: Port availability
echo -n "Checking port 5432 (PostgreSQL)... "
if ! lsof -i :5432 &> /dev/null; then
    echo -e "${GREEN}✓${NC} (available)"
else
    echo -e "${YELLOW}⚠${NC} (in use)"
    echo "  Warning: Port 5432 already in use (likely local PostgreSQL)"
    echo "  Either stop local PostgreSQL or use a different port in docker-compose.test.yml"
    ((WARNINGS++))
fi

# Check 7: Disk space
echo -n "Checking disk space... "
AVAILABLE_GB=$(df -g . | tail -1 | awk '{print $4}')
if [[ $AVAILABLE_GB -ge 10 ]]; then
    echo -e "${GREEN}✓${NC} (${AVAILABLE_GB}GB free)"
else
    echo -e "${YELLOW}⚠${NC} (${AVAILABLE_GB}GB free)"
    echo "  Warning: Low disk space. Docker images need ~5GB"
    ((WARNINGS++))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"

if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Ready to run tests:"
    echo "  pnpm test:docker:unit"
    echo "  pnpm test:docker:parallel"
    echo "  pnpm test:docker:all"
    exit 0
elif [[ $ERRORS -eq 0 ]]; then
    echo -e "${YELLOW}⚠ Checks completed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Infrastructure is functional but not optimal."
    echo "See warnings above for recommended improvements."
    exit 0
else
    echo -e "${RED}✗ Checks failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Fix errors above before running Docker tests."
    exit 1
fi
