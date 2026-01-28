#!/bin/bash

# Villa SDK Independent Release Script
# Usage: ./scripts/sdk-release.sh [package] [version-type] [--dry-run]
#   package: sdk | sdk-react | all
#   version-type: patch | minor | major | prerelease | [specific version]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SDK_DIR="$ROOT_DIR/packages/sdk"
SDK_REACT_DIR="$ROOT_DIR/packages/sdk-react"
DRY_RUN=false

# Help function
show_help() {
    cat << EOF
Villa SDK Independent Release Tool

USAGE:
    ./scripts/sdk-release.sh [PACKAGE] [VERSION] [OPTIONS]

ARGUMENTS:
    PACKAGE         Which package to release (required)
                   • sdk          - Core SDK only
                   • sdk-react    - React bindings only  
                   • all          - Both packages

    VERSION         Version bump type (required)
                   • patch        - Bug fixes (1.0.0 → 1.0.1)
                   • minor        - New features (1.0.0 → 1.1.0)
                   • major        - Breaking changes (1.0.0 → 2.0.0)
                   • prerelease   - Alpha/beta (1.0.0 → 1.0.1-alpha.0)
                   • X.Y.Z        - Specific version number

OPTIONS:
    --dry-run       Preview changes without executing
    --help          Show this help

EXAMPLES:
    ./scripts/sdk-release.sh sdk patch
    ./scripts/sdk-release.sh all minor --dry-run
    ./scripts/sdk-release.sh sdk-react 2.1.0
    ./scripts/sdk-release.sh sdk prerelease

NOTES:
    • Validates dependencies and compatibility
    • Updates CHANGELOG.md automatically
    • Creates git tag for releases
    • Can trigger CI/CD pipeline
    • Independent from monorepo version

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
PACKAGE=""
VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [[ -z "$PACKAGE" ]]; then
                PACKAGE="$1"
            elif [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                log_error "Too many arguments: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$PACKAGE" ]] || [[ -z "$VERSION" ]]; then
    log_error "Missing required arguments"
    show_help
    exit 1
fi

# Validate package argument
case "$PACKAGE" in
    sdk|sdk-react|all)
        ;;
    *)
        log_error "Invalid package: $PACKAGE"
        log_error "Must be one of: sdk, sdk-react, all"
        exit 1
        ;;
esac

# Validate version argument
case "$VERSION" in
    patch|minor|major|prerelease)
        VERSION_TYPE="$VERSION"
        ;;
    [0-9]*.[0-9]*.[0-9]*)
        VERSION_TYPE="specific"
        ;;
    *)
        log_error "Invalid version: $VERSION"
        log_error "Must be: patch|minor|major|prerelease or X.Y.Z format"
        exit 1
        ;;
esac

log_info "Villa SDK Release Tool"
log_info "Package: $PACKAGE"
log_info "Version: $VERSION"
if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "DRY RUN MODE - No changes will be made"
fi
echo ""

# Utility functions
get_current_version() {
    local pkg_dir="$1"
    node -p "require('$pkg_dir/package.json').version"
}

validate_workspace() {
    log_info "Validating workspace..."
    
    # Check if we're in the right directory
    if [[ ! -f "$ROOT_DIR/package.json" ]]; then
        log_error "Not in Villa workspace root"
        exit 1
    fi
    
    # Check if packages exist
    if [[ ! -d "$SDK_DIR" ]]; then
        log_error "SDK package not found at $SDK_DIR"
        exit 1
    fi
    
    if [[ ! -d "$SDK_REACT_DIR" ]]; then
        log_error "SDK React package not found at $SDK_REACT_DIR"
        exit 1
    fi
    
    # Check working directory is clean
    if [[ -n "$(git status --porcelain)" ]]; then
        log_error "Working directory is not clean. Commit or stash changes first."
        exit 1
    fi
    
    # Check if on main branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" != "main" ]]; then
        log_warn "Not on main branch (currently on $current_branch)"
        read -p "Continue anyway? [y/N] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Workspace validation passed"
}

bump_package_version() {
    local pkg_dir="$1"
    local pkg_name="$2"
    
    log_info "Bumping $pkg_name version..."
    
    local current_version=$(get_current_version "$pkg_dir")
    log_info "Current version: $current_version"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        if [[ "$VERSION_TYPE" == "specific" ]]; then
            log_info "Would set version to: $VERSION"
        else
            # Calculate what the new version would be
            cd "$pkg_dir"
            local new_version=$(npm version "$VERSION" --no-git-tag-version --dry-run 2>/dev/null || echo "unknown")
            log_info "Would bump to: $new_version"
            cd "$ROOT_DIR"
        fi
        return
    fi
    
    cd "$pkg_dir"
    
    local new_version
    if [[ "$VERSION_TYPE" == "specific" ]]; then
        # Set specific version
        npm version "$VERSION" --no-git-tag-version >/dev/null
        new_version="$VERSION"
    else
        # Bump version
        new_version=$(npm version "$VERSION" --no-git-tag-version)
        new_version=${new_version#v}  # Remove 'v' prefix
    fi
    
    cd "$ROOT_DIR"
    
    log_success "$pkg_name version: $current_version → $new_version"
    echo "$new_version"
}

update_dependency_versions() {
    if [[ "$PACKAGE" == "all" ]] || [[ "$PACKAGE" == "sdk-react" ]]; then
        log_info "Updating SDK React dependency on core SDK..."
        
        local sdk_version=$(get_current_version "$SDK_DIR")
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "Would update @rockfridrich/villa-sdk to ^$sdk_version in sdk-react"
            return
        fi
        
        cd "$SDK_REACT_DIR"
        
        # Update peerDependency to use caret range
        local temp_file=$(mktemp)
        node -e "
            const pkg = require('./package.json');
            pkg.peerDependencies['@rockfridrich/villa-sdk'] = '^$sdk_version';
            require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
        "
        
        cd "$ROOT_DIR"
        log_success "Updated SDK React dependency to ^$sdk_version"
    fi
}

sync_all_versions() {
    log_info "Syncing version references across all documentation..."
    
    local sdk_version=$(get_current_version "$SDK_DIR")
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would sync all README and docs to version $sdk_version"
        "$ROOT_DIR/scripts/sync-sdk-versions.sh" dry-run "$sdk_version"
        return
    fi
    
    # Use the version sync script to update all references
    "$ROOT_DIR/scripts/sync-sdk-versions.sh" sync "$sdk_version"
    
    # Verify the sync worked
    if ! "$ROOT_DIR/scripts/sync-sdk-versions.sh" check >/dev/null 2>&1; then
        log_error "Version sync verification failed"
        "$ROOT_DIR/scripts/sync-sdk-versions.sh" check
        exit 1
    fi
    
    log_success "All version references synced to $sdk_version"
}

update_changelog() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local version="$3"
    
    log_info "Updating $pkg_name changelog..."
    
    local changelog_file="$pkg_dir/CHANGELOG.md"
    local date=$(date '+%Y-%m-%d')
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would add changelog entry for $version"
        return
    fi
    
    # Create changelog if it doesn't exist
    if [[ ! -f "$changelog_file" ]]; then
        cat > "$changelog_file" << EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [$version] - $date

### Added
- Initial release

EOF
    else
        # Add new entry after "## [Unreleased]"
        local temp_file=$(mktemp)
        awk -v version="$version" -v date="$date" '
            /^## \[Unreleased\]/ {
                print $0
                print ""
                print "## [" version "] - " date
                print ""
                print "### Added"
                print "### Changed" 
                print "### Fixed"
                print ""
                next
            }
            { print }
        ' "$changelog_file" > "$temp_file"
        mv "$temp_file" "$changelog_file"
    fi
    
    log_success "Updated $pkg_name changelog"
}

build_packages() {
    log_info "Building packages..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would build SDK packages"
        return
    fi
    
    # Run verification to ensure everything builds and tests pass
    log_info "Running full verification..."
    bun verify
    
    log_success "All packages built and verified"
}

create_git_tags() {
    local packages_info="$1"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would create git tags:"
        echo "$packages_info"
        return
    fi
    
    log_info "Creating git commit and tags..."
    
    # Add changed files
    git add packages/sdk/package.json packages/sdk/CHANGELOG.md 2>/dev/null || true
    git add packages/sdk-react/package.json packages/sdk-react/CHANGELOG.md 2>/dev/null || true
    
    # Create commit
    local commit_msg="chore(sdk): release packages"
    if [[ "$PACKAGE" == "sdk" ]]; then
        local version=$(get_current_version "$SDK_DIR")
        commit_msg="chore(sdk): release v$version"
    elif [[ "$PACKAGE" == "sdk-react" ]]; then
        local version=$(get_current_version "$SDK_REACT_DIR")
        commit_msg="chore(sdk-react): release v$version"
    fi
    
    git commit -m "$commit_msg" -m "$packages_info"
    
    # Create tags
    if [[ "$PACKAGE" == "sdk" ]] || [[ "$PACKAGE" == "all" ]]; then
        local sdk_version=$(get_current_version "$SDK_DIR")
        git tag "sdk-v$sdk_version" -m "SDK release $sdk_version"
        log_success "Created tag: sdk-v$sdk_version"
    fi
    
    if [[ "$PACKAGE" == "sdk-react" ]] || [[ "$PACKAGE" == "all" ]]; then
        local react_version=$(get_current_version "$SDK_REACT_DIR")
        git tag "sdk-react-v$react_version" -m "SDK React release $react_version"
        log_success "Created tag: sdk-react-v$react_version"
    fi
}

show_next_steps() {
    log_info "Next steps:"
    echo ""
    echo "1. Review the changes:"
    echo "   git log -1 --oneline"
    echo "   git show --name-only"
    echo ""
    echo "2. Push to trigger CI/CD:"
    echo "   git push origin main --tags"
    echo ""
    echo "3. Monitor the publish workflow:"
    echo "   https://github.com/rockfridrich/villa/actions/workflows/sdk-publish.yml"
    echo ""
    echo "4. Verify packages are published:"
    echo "   npm view @rockfridrich/villa-sdk version"
    echo "   npm view @rockfridrich/villa-sdk-react version"
}

# Main execution
main() {
    validate_workspace
    
    local packages_info=""
    
    # Process packages
    if [[ "$PACKAGE" == "sdk" ]] || [[ "$PACKAGE" == "all" ]]; then
        local new_version=$(bump_package_version "$SDK_DIR" "SDK")
        if [[ -n "$new_version" ]]; then
            update_changelog "$SDK_DIR" "SDK" "$new_version"
            packages_info+="@rockfridrich/villa-sdk@$new_version"$'\n'
        fi
    fi
    
    if [[ "$PACKAGE" == "sdk-react" ]] || [[ "$PACKAGE" == "all" ]]; then
        local new_version=$(bump_package_version "$SDK_REACT_DIR" "SDK React")
        if [[ -n "$new_version" ]]; then
            update_changelog "$SDK_REACT_DIR" "SDK React" "$new_version"
            packages_info+="@rockfridrich/villa-sdk-react@$new_version"$'\n'
        fi
    fi
    
    # Update cross-dependencies
    update_dependency_versions
    
    # Sync all version references across documentation
    sync_all_versions
    
    # Build and verify
    build_packages
    
    # Git operations
    if [[ "$DRY_RUN" != "true" ]]; then
        create_git_tags "$packages_info"
        
        echo ""
        log_success "Release preparation complete!"
        show_next_steps
    else
        echo ""
        log_info "DRY RUN completed. No changes made."
    fi
}

main "$@"