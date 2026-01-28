#!/usr/bin/env bash
set -euo pipefail

# Villa SDK Version Sync Script
# Syncs version references across all README files, docs, and examples

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
  echo "Usage: $0 [command] [version]"
  echo ""
  echo "Commands:"
  echo "  sync <version>    Sync version across all files"
  echo "  check             Check current version consistency"
  echo "  list              List all version references"
  echo "  dry-run <version> Show what would be changed without making changes"
  echo ""
  echo "Examples:"
  echo "  $0 sync 0.3.1"
  echo "  $0 check"
  echo "  $0 dry-run 0.4.0-beta.2"
  echo ""
  echo "Version format: MAJOR.MINOR.PATCH[-prerelease]"
}

log_info() {
  echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
  echo -e "${GREEN}✓ ${1}${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_error() {
  echo -e "${RED}✗ ${1}${NC}"
}

# Get current version from SDK package.json
get_current_version() {
  if [[ ! -f "packages/sdk/package.json" ]]; then
    log_error "packages/sdk/package.json not found"
    exit 1
  fi
  
  jq -r '.version' packages/sdk/package.json
}

# Get current version from SDK React package.json
get_current_react_version() {
  if [[ ! -f "packages/sdk-react/package.json" ]]; then
    log_error "packages/sdk-react/package.json not found"
    exit 1
  fi
  
  jq -r '.version' packages/sdk-react/package.json
}

# Validate version format
validate_version() {
  local version="$1"
  if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
    log_error "Invalid version format: $version"
    echo "Version must be MAJOR.MINOR.PATCH[-prerelease]"
    echo "Examples: 1.0.0, 1.2.3-beta.1, 2.0.0-rc.1"
    exit 1
  fi
}

# Files to update with version references
get_files_to_update() {
  cat <<EOF
README.md
CLAUDE.md
packages/sdk/README.md
packages/sdk-react/README.md
docs/INTEGRATION-GUIDE.md
docs/api/README.md
docs/guides/nextjs.md
docs/guides/vanilla.md
docs/guides/migration-from-nextauth.md
packages/sdk/AUTH-UTILITIES.md
examples/nextjs-app/README.md
EOF
}

# Update package.json files
update_package_versions() {
  local new_version="$1"
  local dry_run="${2:-false}"
  
  log_info "Updating package.json files..."
  
  # Update SDK package.json
  if [[ "$dry_run" == "true" ]]; then
    echo "  Would update packages/sdk/package.json: version → $new_version"
  else
    jq ".version = \"$new_version\"" packages/sdk/package.json > packages/sdk/package.json.tmp
    mv packages/sdk/package.json.tmp packages/sdk/package.json
    log_success "Updated packages/sdk/package.json"
  fi
  
  # Update SDK React package.json (also update the peer dependency)
  if [[ "$dry_run" == "true" ]]; then
    echo "  Would update packages/sdk-react/package.json: version → $new_version"
    echo "  Would update packages/sdk-react/package.json: peerDependencies.@rockfridrich/villa-sdk → ^$new_version"
  else
    jq ".version = \"$new_version\" | .peerDependencies[\"@rockfridrich/villa-sdk\"] = \"^$new_version\"" packages/sdk-react/package.json > packages/sdk-react/package.json.tmp
    mv packages/sdk-react/package.json.tmp packages/sdk-react/package.json
    log_success "Updated packages/sdk-react/package.json"
  fi
}

# Update version references in documentation files
update_documentation() {
  local new_version="$1"
  local dry_run="${2:-false}"
  
  log_info "Updating documentation files..."
  
  while IFS= read -r file; do
    if [[ ! -f "$file" ]]; then
      log_warning "File not found: $file"
      continue
    fi
    
    if [[ "$dry_run" == "true" ]]; then
      # Count potential changes
      local npm_badge_changes=0
      local react_badge_changes=0
      local version_refs=0
      
      if grep -q "img\.shields\.io/npm/v/@rockfridrich/villa-sdk" "$file" 2>/dev/null; then
        npm_badge_changes=$(grep -c "img\.shields\.io/npm/v/@rockfridrich/villa-sdk" "$file" 2>/dev/null)
      fi
      
      if grep -q "img\.shields\.io/npm/v/@rockfridrich/villa-sdk-react" "$file" 2>/dev/null; then
        react_badge_changes=$(grep -c "img\.shields\.io/npm/v/@rockfridrich/villa-sdk-react" "$file" 2>/dev/null)
      fi
      
      if grep -q "\^[0-9]\+\.[0-9]\+\.[0-9]\+" "$file" 2>/dev/null; then
        version_refs=$(grep -c "\^[0-9]\+\.[0-9]\+\.[0-9]\+" "$file" 2>/dev/null)
      fi
      
      if [[ $npm_badge_changes -gt 0 || $react_badge_changes -gt 0 || $version_refs -gt 0 ]]; then
        echo "  Would update $file"
        [[ $npm_badge_changes -gt 0 ]] && echo "    - $npm_badge_changes SDK badge references"
        [[ $react_badge_changes -gt 0 ]] && echo "    - $react_badge_changes SDK React badge references"
        [[ $version_refs -gt 0 ]] && echo "    - $version_refs version references"
      fi
    else
      # Create backup
      cp "$file" "$file.bak"
      
      # Update npm version badges
      sed -i.tmp "s|img\.shields\.io/npm/v/@rockfridrich/villa-sdk\.svg|img.shields.io/npm/v/@rockfridrich/villa-sdk.svg|g" "$file"
      sed -i.tmp "s|img\.shields\.io/npm/v/@rockfridrich/villa-sdk-react\.svg|img.shields.io/npm/v/@rockfridrich/villa-sdk-react.svg|g" "$file"
      
      # Update version references in examples (various formats)
      # Only update Villa SDK package version references, not other packages
      sed -i.tmp 's/"@rockfridrich\/villa-sdk": "\^[^"]*"/"@rockfridrich\/villa-sdk": "^'"$new_version"'"/g' "$file"
      sed -i.tmp 's/"@rockfridrich\/villa-sdk-react": "\^[^"]*"/"@rockfridrich\/villa-sdk-react": "^'"$new_version"'"/g' "$file"
      
      # Clean up temp file
      rm -f "$file.tmp"
      
      # Check if file was modified
      if ! cmp -s "$file" "$file.bak"; then
        log_success "Updated $file"
        rm "$file.bak"
      else
        # No changes, restore from backup
        rm "$file.bak"
      fi
    fi
  done < <(get_files_to_update)
}

# Check version consistency across all files
check_versions() {
  log_info "Checking version consistency..."
  
  local sdk_version
  sdk_version=$(get_current_version)
  local react_version
  react_version=$(get_current_react_version)
  
  echo "Current versions:"
  echo "  SDK: $sdk_version"
  echo "  SDK React: $react_version"
  echo ""
  
  local inconsistencies=0
  
  # Check if SDK and SDK React versions match
  if [[ "$sdk_version" != "$react_version" ]]; then
    log_error "Version mismatch between SDK ($sdk_version) and SDK React ($react_version)"
    ((inconsistencies++))
  fi
  
  # Check peer dependency in SDK React
  local peer_dep_version
  peer_dep_version=$(jq -r '.peerDependencies["@rockfridrich/villa-sdk"]' packages/sdk-react/package.json)
  local expected_peer="^$sdk_version"
  if [[ "$peer_dep_version" != "$expected_peer" ]]; then
    log_error "SDK React peer dependency mismatch: expected $expected_peer, got $peer_dep_version"
    ((inconsistencies++))
  fi
  
  # Check version references in documentation
  log_info "Checking documentation files..."
  while IFS= read -r file; do
    if [[ ! -f "$file" ]]; then
      continue
    fi
    
    # Look for outdated version references
    if grep -q "\^[0-9]\+\.[0-9]\+\.[0-9]\+" "$file"; then
      local found_versions
      found_versions=$(grep -o "\^[0-9]\+\.[0-9]\+\.[0-9]\+\(-[^\"]*\)\?" "$file" | sort -u)
      while IFS= read -r found_version; do
        local clean_version="${found_version#^}"
        if [[ "$clean_version" != "$sdk_version" ]]; then
          log_warning "$file contains outdated version reference: $found_version (current: $sdk_version)"
          ((inconsistencies++))
        fi
      done <<< "$found_versions"
    fi
  done < <(get_files_to_update)
  
  if [[ $inconsistencies -eq 0 ]]; then
    log_success "All version references are consistent"
    return 0
  else
    log_error "Found $inconsistencies version inconsistencies"
    return 1
  fi
}

# List all version references
list_versions() {
  log_info "Listing all version references..."
  
  echo "Package versions:"
  echo "  SDK: $(get_current_version)"
  echo "  SDK React: $(get_current_react_version)"
  echo ""
  
  echo "Documentation references:"
  while IFS= read -r file; do
    if [[ ! -f "$file" ]]; then
      continue
    fi
    
    local versions
    versions=$(grep -o "\^[0-9]\+\.[0-9]\+\.[0-9]\+\(-[^\"]*\)\?" "$file" 2>/dev/null | sort -u || true)
    if [[ -n "$versions" ]]; then
      echo "  $file:"
      while IFS= read -r version; do
        echo "    $version"
      done <<< "$versions"
    fi
  done < <(get_files_to_update)
}

# Main sync function
sync_versions() {
  local new_version="$1"
  local dry_run="${2:-false}"
  
  validate_version "$new_version"
  
  if [[ "$dry_run" == "true" ]]; then
    log_info "DRY RUN: Showing what would be changed for version $new_version"
    echo ""
  else
    log_info "Syncing to version $new_version"
    echo ""
  fi
  
  # Update package.json files first
  update_package_versions "$new_version" "$dry_run"
  
  # Update documentation
  update_documentation "$new_version" "$dry_run"
  
  if [[ "$dry_run" == "true" ]]; then
    echo ""
    log_info "DRY RUN complete. Use 'sync $new_version' to apply changes."
  else
    echo ""
    log_success "Version sync complete!"
    log_info "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Test the packages: bun verify"
    echo "  3. Commit changes: git add . && git commit -m \"sync: update SDK versions to $new_version\""
  fi
}

# Main script logic
main() {
  # Check if we're in the right directory
  if [[ ! -f "package.json" ]] || [[ ! -d "packages/sdk" ]]; then
    log_error "Must be run from the root of the Villa repository"
    exit 1
  fi
  
  # Check dependencies
  if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed. Install with: brew install jq"
    exit 1
  fi
  
  case "${1:-help}" in
    sync)
      if [[ -z "${2:-}" ]]; then
        log_error "Version argument required for sync command"
        usage
        exit 1
      fi
      sync_versions "$2"
      ;;
    check)
      check_versions
      ;;
    list)
      list_versions
      ;;
    dry-run)
      if [[ -z "${2:-}" ]]; then
        log_error "Version argument required for dry-run command"
        usage
        exit 1
      fi
      sync_versions "$2" "true"
      ;;
    help|--help|-h)
      usage
      ;;
    *)
      log_error "Unknown command: $1"
      usage
      exit 1
      ;;
  esac
}

main "$@"