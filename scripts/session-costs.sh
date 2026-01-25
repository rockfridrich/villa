#!/usr/bin/env bash
set -e

HAIKU_RATE="0.25"
SONNET_RATE="3.00"
OPUS_RATE="15.00"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  💰 Session Cost Estimate${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_model_rates() {
  echo ""
  echo -e "${YELLOW}Model Rates (per 1M tokens):${NC}"
  echo "  Haiku:  \$0.25  (explore, librarian, test, ops)"
  echo "  Sonnet: \$3.00  (build, design, review, frontend)"
  echo "  Opus:   \$15.00 (oracle, architect, spec)"
  echo ""
}

estimate_session() {
  local duration_mins="${1:-30}"
  local complexity="${2:-medium}"
  
  # Rough token estimates per minute by complexity
  local tokens_per_min
  case "$complexity" in
    "light") tokens_per_min=2000 ;;
    "medium") tokens_per_min=5000 ;;
    "heavy") tokens_per_min=10000 ;;
    *) tokens_per_min=5000 ;;
  esac
  
  local total_tokens=$((duration_mins * tokens_per_min))
  
  # Typical distribution by complexity
  local haiku_pct sonnet_pct opus_pct
  case "$complexity" in
    "light")
      haiku_pct=60
      sonnet_pct=35
      opus_pct=5
      ;;
    "medium")
      haiku_pct=40
      sonnet_pct=50
      opus_pct=10
      ;;
    "heavy")
      haiku_pct=30
      sonnet_pct=50
      opus_pct=20
      ;;
  esac
  
  local haiku_tokens=$((total_tokens * haiku_pct / 100))
  local sonnet_tokens=$((total_tokens * sonnet_pct / 100))
  local opus_tokens=$((total_tokens * opus_pct / 100))
  
  # Calculate costs (tokens / 1M * rate)
  local haiku_cost=$(echo "scale=2; $haiku_tokens / 1000000 * 0.25" | bc)
  local sonnet_cost=$(echo "scale=2; $sonnet_tokens / 1000000 * 3.00" | bc)
  local opus_cost=$(echo "scale=2; $opus_tokens / 1000000 * 15.00" | bc)
  local total_cost=$(echo "scale=2; $haiku_cost + $sonnet_cost + $opus_cost" | bc)
  
  echo -e "${GREEN}Session Estimate (${duration_mins} min, ${complexity} complexity):${NC}"
  echo ""
  printf "  %-10s %10s tokens  \$%6.2f\n" "Haiku:" "$haiku_tokens" "$haiku_cost"
  printf "  %-10s %10s tokens  \$%6.2f\n" "Sonnet:" "$sonnet_tokens" "$sonnet_cost"
  printf "  %-10s %10s tokens  \$%6.2f\n" "Opus:" "$opus_tokens" "$opus_cost"
  echo "  ────────────────────────────────────"
  printf "  %-10s %10s tokens  ${YELLOW}\$%6.2f${NC}\n" "TOTAL:" "$total_tokens" "$total_cost"
  echo ""
}

show_agent_costs() {
  echo -e "${YELLOW}Agent Cost Reference:${NC}"
  echo ""
  echo "  CHEAP (Haiku \$0.25/1M):"
  echo "    explore, librarian, test, ops, document-writer"
  echo ""
  echo "  STANDARD (Sonnet \$3/1M):"
  echo "    build, design, review, frontend-ui-ux-engineer"
  echo ""
  echo "  PREMIUM (Opus \$15/1M):"
  echo "    oracle, architect, spec"
  echo ""
  echo -e "${RED}⚠️  Oracle/Opus is 60x more expensive than Haiku!${NC}"
  echo ""
}

show_optimization_tips() {
  echo -e "${GREEN}Cost Optimization Tips:${NC}"
  echo ""
  echo "  1. Use 'explore' for codebase search (not oracle)"
  echo "  2. Use 'librarian' for external docs lookup"
  echo "  3. Use 'build' for code changes (not oracle)"
  echo "  4. Only use 'oracle' for architecture decisions"
  echo "  5. Batch related questions in single prompts"
  echo "  6. Be specific - vague prompts cost more tokens"
  echo ""
}

# Main
case "${1:-help}" in
  "estimate")
    print_header
    estimate_session "${2:-30}" "${3:-medium}"
    ;;
  "rates")
    print_header
    print_model_rates
    ;;
  "agents")
    print_header
    show_agent_costs
    ;;
  "tips")
    print_header
    show_optimization_tips
    ;;
  "full")
    print_header
    print_model_rates
    show_agent_costs
    estimate_session "${2:-30}" "${3:-medium}"
    show_optimization_tips
    ;;
  *)
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  estimate [mins] [complexity]  - Estimate session cost"
    echo "                                  complexity: light|medium|heavy"
    echo "  rates                         - Show model pricing"
    echo "  agents                        - Show agent-to-model mapping"
    echo "  tips                          - Show optimization tips"
    echo "  full [mins] [complexity]      - Full report"
    echo ""
    echo "Examples:"
    echo "  $0 estimate 60 heavy   # 1 hour heavy session"
    echo "  $0 full 30 medium      # Full report, 30 min medium"
    ;;
esac
