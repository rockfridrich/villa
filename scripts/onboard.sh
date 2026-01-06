#!/bin/bash
# Villa Contributor Onboarding
# Interactive wizard for new contributors
# Usage: ./scripts/onboard.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Emojis
CHECK="✓"
CROSS="✗"
ROCKET="🚀"
PARTY="🎉"
TROPHY="🏆"
WRENCH="🔧"
BOOK="📚"

# Print functions
print_header() {
    echo -e "\n${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${PURPLE}  $1${NC}"
    echo -e "${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 found: $(command -v "$1")"
        return 0
    else
        print_error "$1 not found"
        return 1
    fi
}

# Check version
check_version() {
    local cmd="$1"
    local min_version="$2"
    local current_version

    case "$cmd" in
        node)
            current_version=$(node --version | sed 's/v//')
            ;;
        pnpm)
            current_version=$(pnpm --version)
            ;;
        *)
            current_version="unknown"
            ;;
    esac

    echo "$current_version"
}

# Security: Validate we're in a Villa repository
validate_repository() {
    local project_root="$1"

    # Must have package.json with "villa" in name
    if [ ! -f "$project_root/package.json" ]; then
        print_error "Not in a valid project directory (missing package.json)"
        exit 1
    fi

    # Verify package.json contains villa (basic check)
    if ! grep -q '"name".*villa' "$project_root/package.json" 2>/dev/null; then
        print_error "This doesn't appear to be a Villa repository"
        exit 1
    fi

    # Check for symlink attacks on critical files
    for file in ".env.example" ".claude/local/preferences.template.json"; do
        if [ -e "$project_root/$file" ]; then
            # Resolve the real path and ensure it's within project
            local real_path
            real_path=$(cd "$project_root" && realpath "$file" 2>/dev/null || echo "")
            if [ -n "$real_path" ] && [[ "$real_path" != "$project_root"* ]]; then
                print_error "Security: $file points outside repository"
                exit 1
            fi
        fi
    done
}

# Main onboarding flow
main() {
    clear
    print_header "${ROCKET} Welcome to Villa Contributor Onboarding ${ROCKET}"

    echo -e "This wizard will help you set up your development environment"
    echo -e "and make your first contribution to Villa.\n"

    # Step 1: Check dependencies
    print_header "${WRENCH} Step 1: Checking Dependencies"

    local deps_ok=true

    # Node.js
    print_step "Checking Node.js..."
    if check_command "node"; then
        node_version=$(check_version "node")
        major_version=$(echo "$node_version" | cut -d. -f1)
        if [ "$major_version" -ge 20 ]; then
            print_success "Node.js version $node_version (>= 20 required)"
        else
            print_error "Node.js version $node_version is too old. Need >= 20"
            deps_ok=false
        fi
    else
        print_info "Install Node.js 20+: https://nodejs.org/"
        deps_ok=false
    fi

    # pnpm
    print_step "Checking pnpm..."
    if check_command "pnpm"; then
        pnpm_version=$(check_version "pnpm")
        print_success "pnpm version $pnpm_version"
    else
        print_info "Install pnpm: npm install -g pnpm"
        deps_ok=false
    fi

    # Git
    print_step "Checking git..."
    if check_command "git"; then
        git_version=$(git --version | awk '{print $3}')
        print_success "git version $git_version"
    else
        print_info "Install git: https://git-scm.com/"
        deps_ok=false
    fi

    # GitHub CLI (optional but recommended)
    print_step "Checking GitHub CLI (optional)..."
    if check_command "gh"; then
        print_success "GitHub CLI found"
        # Check if authenticated
        if gh auth status &> /dev/null; then
            print_success "GitHub CLI authenticated"
        else
            print_warning "GitHub CLI not authenticated. Run: gh auth login"
        fi
    else
        print_warning "GitHub CLI not found. Optional but recommended."
        print_info "Install: https://cli.github.com/"
    fi

    if [ "$deps_ok" = false ]; then
        echo ""
        print_error "Some required dependencies are missing."
        print_info "Please install them and run this script again."
        exit 1
    fi

    print_success "All required dependencies found!"

    # Step 2: Environment setup
    print_header "${BOOK} Step 2: Environment Setup"

    # Navigate to project root securely
    PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
    cd "$PROJECT_ROOT" || exit 1

    # Security: Validate we're in the right repository
    validate_repository "$PROJECT_ROOT"

    # Check if .env.local exists
    if [ -f ".env.local" ]; then
        print_success ".env.local already exists"
    else
        print_step "Creating .env.local from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created .env.local"
            print_info "Edit .env.local to add your configuration"
        else
            print_error ".env.example not found!"
            exit 1
        fi
    fi

    # Check if Claude preferences exist
    if [ -f ".claude/local/preferences.json" ]; then
        print_success "Claude preferences already configured"
    else
        print_step "Setting up Claude Code preferences..."
        if [ -f ".claude/local/preferences.template.json" ]; then
            cp .claude/local/preferences.template.json .claude/local/preferences.json
            print_success "Created Claude preferences file"
            print_info "Claude Code will learn your preferences over time"
        else
            print_warning "Claude preferences template not found (optional)"
        fi
    fi

    # Step 3: Install dependencies
    print_header "${WRENCH} Step 3: Installing Dependencies"

    print_step "Running pnpm install..."
    if pnpm install --frozen-lockfile 2>/dev/null || pnpm install; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi

    # Step 4: First build
    print_header "${ROCKET} Step 4: First Build"

    print_step "Running pnpm build..."
    if pnpm build; then
        print_success "Build successful!"
    else
        print_error "Build failed. Check the errors above."
        print_info "Common fixes:"
        print_info "  - Check .env.local configuration"
        print_info "  - Run: pnpm clean && pnpm install"
        exit 1
    fi

    # Step 5: Type check
    print_header "${CHECK} Step 5: Type Check"

    print_step "Running pnpm typecheck..."
    if pnpm typecheck; then
        print_success "Type check passed!"
    else
        print_warning "Type check had issues (may be expected for first-time setup)"
    fi

    # Step 6: Run doctor
    print_header "${WRENCH} Step 6: Health Check"

    if [ -f "./scripts/doctor.sh" ]; then
        print_step "Running health check..."
        ./scripts/doctor.sh || true
    else
        print_info "Health check script not found (will be created)"
    fi

    # Success!
    print_header "${PARTY} Onboarding Complete! ${PARTY}"

    echo -e "${GREEN}${BOLD}Congratulations! You're ready to contribute to Villa.${NC}\n"

    echo -e "${TROPHY} ${BOLD}Achievement Unlocked: Environment Ready${NC} ${TROPHY}\n"

    echo -e "Next steps:"
    echo -e "  ${CYAN}1.${NC} Find an issue: ${BLUE}https://github.com/rockfridrich/villa/labels/good%20first%20issue${NC}"
    echo -e "  ${CYAN}2.${NC} Read the contributing guide: ${BLUE}CONTRIBUTING.md${NC}"
    echo -e "  ${CYAN}3.${NC} Start the dev server: ${BLUE}pnpm dev${NC}"
    echo -e "  ${CYAN}4.${NC} Run before committing: ${BLUE}pnpm verify${NC}"
    echo -e ""
    echo -e "Need help? Open an issue or check ${BLUE}.claude/CLAUDE.md${NC} for AI assistance.\n"

    # Record achievement (if gh CLI is available and authenticated)
    if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
        username=$(gh api user --jq '.login' 2>/dev/null || echo "")
        if [ -n "$username" ]; then
            print_info "Recording your achievement..."
            # This would normally add a comment to an achievements issue
            # For now, just acknowledge
            print_success "Welcome to Villa, @$username!"
        fi
    fi
}

# Run main function
main "$@"
