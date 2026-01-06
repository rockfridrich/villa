#!/bin/bash
# beads-setup.sh - Set up Beads task memory for local development
#
# Run this once after cloning to enable persistent task tracking.
# Installs bd CLI and configures Claude Code hooks.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== Villa Beads Setup ===${NC}"
echo ""

# Check if bd is installed
if command -v bd &> /dev/null; then
  BD_VERSION=$(bd version 2>/dev/null | head -1 || echo "unknown")
  echo -e "${GREEN}✓ bd installed: $BD_VERSION${NC}"
else
  echo -e "${YELLOW}Installing bd (Beads CLI)...${NC}"

  if command -v brew &> /dev/null; then
    brew install steveyegge/beads/bd
  elif command -v npm &> /dev/null; then
    npm install -g @beads/bd
  elif command -v go &> /dev/null; then
    go install github.com/steveyegge/beads/cmd/bd@latest
  else
    echo -e "${RED}Error: No package manager found (brew/npm/go)${NC}"
    echo "Manual install: https://github.com/steveyegge/beads#installation"
    exit 1
  fi

  echo -e "${GREEN}✓ bd installed${NC}"
fi

# Check if .beads exists (should be tracked in repo)
if [[ ! -d "$PROJECT_ROOT/.beads" ]]; then
  echo -e "${RED}Error: .beads directory not found${NC}"
  echo "This should be tracked in git. Try: git checkout .beads/"
  exit 1
fi

# Verify database can be initialized
cd "$PROJECT_ROOT"
if ! bd doctor --quiet 2>/dev/null; then
  echo -e "${YELLOW}Running bd doctor to fix issues...${NC}"
  bd doctor --fix 2>/dev/null || true
fi

# Set up Claude hooks (project-local)
echo ""
echo -e "${BLUE}Setting up Claude Code hooks...${NC}"

if [[ -f "$PROJECT_ROOT/.claude/settings.local.json" ]]; then
  # Check if hooks already configured
  if grep -q "bd prime" "$PROJECT_ROOT/.claude/settings.local.json" 2>/dev/null; then
    echo -e "${GREEN}✓ Claude hooks already configured${NC}"
  else
    echo -e "${YELLOW}Adding Beads hooks to existing settings...${NC}"
    bd setup claude --project 2>/dev/null || true
    echo -e "${GREEN}✓ Claude hooks added${NC}"
  fi
else
  bd setup claude --project
  echo -e "${GREEN}✓ Claude hooks configured${NC}"
fi

# Show status
echo ""
echo -e "${BLUE}=== Setup Complete ===${NC}"
echo ""
bd ready 2>/dev/null || echo "No tasks yet - create with: bd create \"Task title\""
echo ""
echo -e "${GREEN}Quick commands:${NC}"
echo "  bd ready                        # Find available work"
echo "  bd show <id>                    # Task details"
echo "  ./scripts/bd-workflow.sh start <id>   # Claim task"
echo "  ./scripts/bd-workflow.sh done <id>    # Complete task"
echo ""
echo -e "${YELLOW}Restart Claude Code for hooks to take effect.${NC}"
