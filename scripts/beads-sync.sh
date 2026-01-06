#!/bin/bash
# Beads Sync - Sync specs to Beads tasks
# Creates dependency graph from roadmap specs
#
# Usage: ./scripts/beads-sync.sh [command]
#   status    - Show current task structure
#   graph     - Display dependency graph

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[beads]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }

# Show dependency graph
show_graph() {
  echo ""
  echo -e "${CYAN}┌────────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}│${NC}              Villa SDK Development Dependency Graph            ${CYAN}│${NC}"
  echo -e "${CYAN}└────────────────────────────────────────────────────────────────┘${NC}"
  echo ""
  echo -e "${GREEN}PARALLEL WORKSTREAMS:${NC}"
  echo ""
  echo "┌─ Sprint 3 (Critical Path) ──────────────────────────────────────┐"
  echo "│                                                                 │"
  echo "│   [iframe-bridge]  ──►  [screen-wiring]  ──►  [near-terminal]  │"
  echo "│        ${RED}P0${NC}                    ${RED}P0${NC}                  ${YELLOW}P1${NC}            │"
  echo "│                                                                 │"
  echo "│   Create iframe           Wire to Porto,      Test with Near   │"
  echo "│   postMessage bridge      on-chain resolver   Terminal         │"
  echo "│                                                                 │"
  echo "└─────────────────────────────────────────────────────────────────┘"
  echo ""
  echo "┌─ UI Components (Parallelizable) ────────────────────────────────┐"
  echo "│                                                                 │"
  echo "│   [mobile-nav]    [alert]    [badge]    [dropdown-menu]        │"
  echo "│       ${YELLOW}P1${NC}          ${YELLOW}P1${NC}         ${YELLOW}P1${NC}            ${YELLOW}P1${NC}                │"
  echo "│                                                                 │"
  echo "│   No dependencies - can run in parallel                        │"
  echo "│                                                                 │"
  echo "└─────────────────────────────────────────────────────────────────┘"
  echo ""
  echo "┌─ Infrastructure ────────────────────────────────────────────────┐"
  echo "│                                                                 │"
  echo "│                     ┌──► [tinycloud-storage] ${YELLOW}P1${NC}               │"
  echo "│   [mainnet-deploy] ─┤                                          │"
  echo "│         ${RED}P0${NC}          └──► [ens-gateway] ${BLUE}P2${NC}                     │"
  echo "│                                                                 │"
  echo "│   Blocked by: security-audit                                   │"
  echo "│                                                                 │"
  echo "└─────────────────────────────────────────────────────────────────┘"
  echo ""
  echo "┌─ Security (Blocking) ───────────────────────────────────────────┐"
  echo "│                                                                 │"
  echo "│   [security-fixes]  ──►  [security-audit]  ──►  [mainnet]      │"
  echo "│        ${GREEN}✅ DONE${NC}              ${RED}P0${NC}                  ${RED}P0${NC}            │"
  echo "│                                                                 │"
  echo "│   postMessage,           External audit       Production       │"
  echo "│   localStorage fixed     before mainnet       deployment       │"
  echo "│                                                                 │"
  echo "└─────────────────────────────────────────────────────────────────┘"
  echo ""
  echo -e "${CYAN}LEGEND:${NC} [task-id]  ──►  depends on"
  echo -e "        ${RED}P0${NC} Critical  ${YELLOW}P1${NC} High  ${BLUE}P2${NC} Medium  ${GREEN}✅${NC} Complete"
  echo ""
}

# Agent assignment recommendations
show_agents() {
  echo ""
  echo -e "${CYAN}┌────────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}│${NC}                Agent Assignment Recommendations                ${CYAN}│${NC}"
  echo -e "${CYAN}└────────────────────────────────────────────────────────────────┘${NC}"
  echo ""
  echo "  ${GREEN}Sprint 3 (Critical):${NC}"
  echo "    • @build (sonnet) - iframe bridge, screen wiring"
  echo "    • @test (haiku) - integration tests"
  echo ""
  echo "  ${YELLOW}UI Components (Parallel):${NC}"
  echo "    • @design (sonnet) - mobile nav, shadcn components"
  echo "    • Can run 4 agents in parallel"
  echo ""
  echo "  ${BLUE}Infrastructure:${NC}"
  echo "    • @ops (haiku) - deployments, CI monitoring"
  echo "    • @solidity (opus) - mainnet contracts"
  echo ""
  echo "  ${RED}Security:${NC}"
  echo "    • @review (sonnet) - audit prep"
  echo "    • @test (haiku) - security regression tests"
  echo ""
}

# Show current Beads status
show_status() {
  log "Current Beads Tasks:"
  echo ""
  bd ready 2>/dev/null || warn "No Beads tasks found"
}

# Main
case "${1:-status}" in
  status)
    show_status
    ;;
  graph)
    show_graph
    show_agents
    ;;
  *)
    echo "Usage: $0 [status|graph]"
    echo ""
    echo "Commands:"
    echo "  status  - Show current Beads task structure"
    echo "  graph   - Display dependency graph from specs"
    exit 1
    ;;
esac
