#!/bin/bash
# Villa Environment Health Check
# Verifies that your development environment is properly configured
# Usage: ./scripts/doctor.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Counters
PASS=0
WARN=0
FAIL=0

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARN++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Header
echo -e "\n${BOLD}Villa Environment Health Check${NC}"
echo -e "────────────────────────────────────────\n"

# Move to project root
cd "$(dirname "$0")/.." || exit 1
PROJECT_ROOT=$(pwd)

# 1. Node.js version
echo -e "${BOLD}Runtime${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$MAJOR" -ge 20 ]; then
        check_pass "Node.js $NODE_VERSION"
    else
        check_fail "Node.js $NODE_VERSION (need >= 20)"
    fi
else
    check_fail "Node.js not installed"
fi

# 2. pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    check_pass "pnpm $PNPM_VERSION"
else
    check_fail "pnpm not installed"
fi

# 3. Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    check_pass "git $GIT_VERSION"

    # Check if in a git repo
    if git rev-parse --git-dir &> /dev/null; then
        check_pass "Inside git repository"

        # Check remote
        if git remote get-url origin &> /dev/null; then
            REMOTE=$(git remote get-url origin)
            check_pass "Remote: $REMOTE"
        else
            check_warn "No git remote configured"
        fi
    else
        check_fail "Not inside a git repository"
    fi
else
    check_fail "git not installed"
fi

echo ""

# 4. Environment files
echo -e "${BOLD}Environment${NC}"
if [ -f ".env.local" ]; then
    check_pass ".env.local exists"

    # Check for required variables
    if grep -q "NEXT_PUBLIC_CHAIN_ID" .env.local; then
        check_pass "NEXT_PUBLIC_CHAIN_ID configured"
    else
        check_warn "NEXT_PUBLIC_CHAIN_ID not set in .env.local"
    fi
else
    check_fail ".env.local missing (copy from .env.example)"
fi

if [ -f ".env.example" ]; then
    check_pass ".env.example exists"
else
    check_warn ".env.example missing"
fi

echo ""

# 5. Dependencies
echo -e "${BOLD}Dependencies${NC}"
if [ -d "node_modules" ]; then
    check_pass "node_modules exists"

    # Check if pnpm-lock.yaml matches
    if [ -f "pnpm-lock.yaml" ]; then
        check_pass "pnpm-lock.yaml exists"
    else
        check_warn "pnpm-lock.yaml missing"
    fi
else
    check_fail "node_modules missing (run: pnpm install)"
fi

echo ""

# 6. Build artifacts
echo -e "${BOLD}Build${NC}"
if [ -d "apps/web/.next" ]; then
    check_pass "apps/web/.next exists (web app built)"
else
    check_warn "apps/web/.next missing (run: pnpm build)"
fi

echo ""

# 7. Optional tools
echo -e "${BOLD}Optional Tools${NC}"

# GitHub CLI
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null 2>&1; then
        GH_USER=$(gh api user --jq '.login' 2>/dev/null || echo "unknown")
        check_pass "GitHub CLI authenticated as @$GH_USER"
    else
        check_warn "GitHub CLI installed but not authenticated"
        check_info "  Run: gh auth login"
    fi
else
    check_warn "GitHub CLI not installed"
    check_info "  Install: https://cli.github.com/"
fi

# ngrok
if command -v ngrok &> /dev/null; then
    check_pass "ngrok installed"
else
    check_warn "ngrok not installed (needed for mobile QA)"
    check_info "  Install: https://ngrok.com/download"
fi

# mkcert
if command -v mkcert &> /dev/null; then
    check_pass "mkcert installed"
else
    check_warn "mkcert not installed (needed for local HTTPS)"
    check_info "  Install: brew install mkcert"
fi

# doctl
if command -v doctl &> /dev/null; then
    check_pass "doctl installed"
else
    check_warn "doctl not installed (needed for deployment)"
    check_info "  Install: brew install doctl"
fi

echo ""

# 8. Claude Code (if applicable)
echo -e "${BOLD}AI Assistance${NC}"
if [ -f ".claude/CLAUDE.md" ]; then
    check_pass "Claude Code context exists"
fi

if [ -f ".claude/local/preferences.json" ]; then
    check_pass "Claude preferences configured"
else
    check_warn "Claude preferences not configured"
    check_info "  Copy: .claude/local/preferences.template.json"
fi

echo ""

# Summary
echo -e "────────────────────────────────────────"
echo -e "${BOLD}Summary${NC}"
echo -e "  ${GREEN}✓ Passed:${NC}  $PASS"
echo -e "  ${YELLOW}! Warnings:${NC} $WARN"
echo -e "  ${RED}✗ Failed:${NC}  $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}${BOLD}Environment has issues. Fix the failures above.${NC}"
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}${BOLD}Environment is usable but has warnings.${NC}"
    exit 0
else
    echo -e "${GREEN}${BOLD}Environment is healthy!${NC}"
    exit 0
fi
