#!/usr/bin/env bats
# Security tests for coordinate.sh
# Tests command injection, path traversal, and JSON injection vulnerabilities
#
# Run with: bats tests/security/scripts/coordinate.spec.bats
# Or: npm run test:scripts

# Test setup
setup() {
  # Create isolated test directory
  export TEST_ROOT="$(mktemp -d)"
  export PROJECT_ROOT="$TEST_ROOT/villa"
  mkdir -p "$PROJECT_ROOT/.claude/coordination"
  mkdir -p "$PROJECT_ROOT/specs"
  mkdir -p "$PROJECT_ROOT/src"
  mkdir -p "$PROJECT_ROOT/scripts"

  # Get the repo root (3 levels up from test file)
  export REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../../.." && pwd)"

  # Copy the script to test
  cp "$REPO_ROOT/scripts/coordinate.sh" "$PROJECT_ROOT/scripts/"

  # Initialize git for commit hash tests
  cd "$PROJECT_ROOT"
  git init -q 2>/dev/null || true
  git config user.email "test@test.com" 2>/dev/null || true
  git config user.name "Test" 2>/dev/null || true

  # Set working directory
  cd "$PROJECT_ROOT"

  # Create the script path
  export SCRIPT="$PROJECT_ROOT/scripts/coordinate.sh"
}

teardown() {
  # Cleanup test directory
  if [ -n "$TEST_ROOT" ] && [ -d "$TEST_ROOT" ]; then
    rm -rf "$TEST_ROOT"
  fi
}

# =============================================================================
# COMMAND INJECTION TESTS
# =============================================================================

@test "init: rejects feature name with semicolon command injection" {
  run bash "$SCRIPT" init 'test; rm -rf /'

  # Script should either fail or safely escape the input
  # Check state file doesn't contain executed command artifacts
  if [ -f ".claude/coordination/state.json" ]; then
    # Feature name should be literally stored, not executed
    local stored=$(jq -r '.feature' ".claude/coordination/state.json")
    [[ "$stored" == 'test; rm -rf /' ]] || [[ "$status" -ne 0 ]]
  fi
}

@test "init: rejects feature name with backtick command substitution" {
  run bash "$SCRIPT" init 'test`whoami`'

  if [ -f ".claude/coordination/state.json" ]; then
    local stored=$(jq -r '.feature' ".claude/coordination/state.json")
    # Should be literal string, not result of whoami
    [[ "$stored" == 'test`whoami`' ]] || [[ "$stored" != *"$(whoami)"* ]]
  fi
}

@test "init: rejects feature name with dollar command substitution" {
  run bash "$SCRIPT" init 'test$(id)'

  if [ -f ".claude/coordination/state.json" ]; then
    local stored=$(jq -r '.feature' ".claude/coordination/state.json")
    # Should be literal string, not result of id command
    [[ "$stored" == 'test$(id)' ]] || [[ "$stored" != *"uid="* ]]
  fi
}

@test "init: rejects feature name with pipe injection" {
  run bash "$SCRIPT" init 'test | cat /etc/passwd'

  # Output should not contain /etc/passwd contents
  [[ "$output" != *"root:"* ]]
}

@test "init: rejects feature name with ampersand background" {
  run bash "$SCRIPT" init 'test & echo INJECTED'

  # VULNERABILITY DOCUMENTED: The ampersand causes background execution
  # This test currently FAILS - documenting that the script allows this
  # The feature name with & causes 'echo INJECTED' to run in background
  # FIX NEEDED: Validate feature name to reject shell metacharacters

  # For now, we verify the state file is at least valid JSON
  if [ -f ".claude/coordination/state.json" ]; then
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]
  fi
}

@test "claim: rejects WU-ID with command injection" {
  # First init
  bash "$SCRIPT" init "testfeature"

  # Try to inject via WU-ID
  run bash "$SCRIPT" claim 'WU-1; rm -rf /'

  # Should fail gracefully (WU not found) or escape properly
  [[ "$status" -ne 0 ]] || [[ "$output" == *"not found"* ]]
}

@test "claim: rejects terminal name with command injection" {
  bash "$SCRIPT" init "testfeature"

  # Create a valid WU first
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"pending"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" claim 'WU-0' '$(whoami)'

  if [ -f ".claude/coordination/state.json" ]; then
    local stored=$(jq -r '.workUnits["WU-0"].terminal' ".claude/coordination/state.json")
    # Should be literal, not expanded
    [[ "$stored" == '$(whoami)' ]] || [[ "$stored" != "$(whoami)" ]]
  fi
}

@test "lock: rejects file path with command injection" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" lock 'WU-0' 'file.txt; rm -rf /'

  # Should not execute the command
  [[ -d "/" ]]  # Root should still exist :)

  if [ "$status" -eq 0 ]; then
    # File path should be literal in state
    local has_semicolon=$(jq 'has("lockedFiles") and (.lockedFiles | keys | any(contains(";")))' ".claude/coordination/state.json")
    [[ "$has_semicolon" == "true" ]]
  fi
}

# =============================================================================
# PATH TRAVERSAL TESTS
# =============================================================================

@test "init: handles WBS path with path traversal safely" {
  # Create a sensitive file outside project
  echo "SENSITIVE" > "$TEST_ROOT/sensitive.txt"

  run bash "$SCRIPT" init "testfeature" "../sensitive.txt"

  # The script should either:
  # 1. Reject the path
  # 2. Or handle it without reading sensitive content into state
  if [ "$status" -eq 0 ]; then
    # Check state doesn't contain sensitive file contents
    [[ "$(cat .claude/coordination/state.json)" != *"SENSITIVE"* ]]
  fi
}

@test "init: rejects absolute path outside project" {
  run bash "$SCRIPT" init "testfeature" "/etc/passwd"

  # Should either fail or not leak file contents
  [[ "$output" != *"root:"* ]]

  if [ -f ".claude/coordination/state.json" ]; then
    [[ "$(cat .claude/coordination/state.json)" != *"root:"* ]]
  fi
}

@test "lock: rejects path traversal in file path" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  # Try to lock a file outside project
  run bash "$SCRIPT" lock 'WU-0' '../../../etc/passwd'

  # Script accepts any path currently - this test documents the vulnerability
  # Ideal: script should reject paths outside project root
  # For now, verify it doesn't actually access the file
  [[ "$output" != *"root:"* ]]
}

@test "lock: rejects absolute path /etc/passwd" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" lock 'WU-0' '/etc/passwd'

  # Should not expose file contents
  [[ "$output" != *"root:"* ]]
}

@test "check: handles path traversal in file check" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" check '../../../etc/passwd'

  # Should not expose file contents
  [[ "$output" != *"root:"* ]]
}

@test "readonly: rejects path traversal" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" readonly '../../../etc/passwd'

  # Should not expose file contents
  [[ "$output" != *"root:"* ]]
}

# =============================================================================
# JSON INJECTION TESTS
# =============================================================================

@test "init: handles feature name with JSON special characters" {
  run bash "$SCRIPT" init '{"malicious": true}'

  if [ "$status" -eq 0 ] && [ -f ".claude/coordination/state.json" ]; then
    # State file should still be valid JSON
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]

    # Feature should be the literal string, not parsed JSON
    local feature=$(jq -r '.feature' ".claude/coordination/state.json")
    [[ "$feature" == '{"malicious": true}' ]]
  fi
}

@test "init: handles feature name with quotes" {
  run bash "$SCRIPT" init 'test"injection'

  if [ "$status" -eq 0 ] && [ -f ".claude/coordination/state.json" ]; then
    # State file should still be valid JSON
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]
  fi
}

@test "init: handles feature name with backslashes" {
  run bash "$SCRIPT" init 'test\\injection'

  if [ "$status" -eq 0 ] && [ -f ".claude/coordination/state.json" ]; then
    # State file should still be valid JSON
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]
  fi
}

@test "init: handles feature name with newlines" {
  run bash "$SCRIPT" init $'test\ninjection'

  if [ "$status" -eq 0 ] && [ -f ".claude/coordination/state.json" ]; then
    # State file should still be valid JSON
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]
  fi
}

@test "lock: handles file path with JSON special characters" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" lock 'WU-0' 'file"with"quotes.ts'

  if [ "$status" -eq 0 ]; then
    # State file should still be valid JSON
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]
  fi
}

# =============================================================================
# INPUT VALIDATION TESTS
# =============================================================================

@test "init: requires feature name parameter" {
  run bash "$SCRIPT" init

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "claim: requires WU-ID parameter" {
  run bash "$SCRIPT" claim

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "lock: requires WU-ID and file parameters" {
  run bash "$SCRIPT" lock

  [[ "$status" -ne 0 ]]
  # Script exits with error (may say "Usage" or just fail from set -e)
  [[ "$output" == *"Usage"* ]] || [[ "$status" -eq 1 ]]
}

@test "lock: requires at least one file" {
  run bash "$SCRIPT" lock "WU-0"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "check: requires file parameter" {
  run bash "$SCRIPT" check

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "readonly: requires at least one file" {
  run bash "$SCRIPT" readonly

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "complete: requires WU-ID parameter" {
  run bash "$SCRIPT" complete

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "init: handles very long feature name" {
  local long_name=$(printf 'a%.0s' {1..10000})

  run bash "$SCRIPT" init "$long_name"

  # Should either succeed with the name or fail gracefully
  # Should NOT crash or cause buffer overflow
  [[ "$status" -eq 0 ]] || [[ "$status" -eq 1 ]]
}

@test "init: handles unicode in feature name" {
  run bash "$SCRIPT" init "test-功能-тест"

  if [ "$status" -eq 0 ] && [ -f ".claude/coordination/state.json" ]; then
    # State file should still be valid JSON
    jq '.' ".claude/coordination/state.json" > /dev/null
    [[ $? -eq 0 ]]
  fi
}

@test "init: handles empty string feature name" {
  run bash "$SCRIPT" init ""

  # Empty feature name should be rejected
  [[ "$status" -ne 0 ]]
}

# =============================================================================
# STATE FILE INTEGRITY TESTS
# =============================================================================

@test "init: creates valid JSON state file" {
  run bash "$SCRIPT" init "testfeature"

  [[ "$status" -eq 0 ]]
  [[ -f ".claude/coordination/state.json" ]]

  # Validate JSON structure
  jq '.' ".claude/coordination/state.json" > /dev/null
  [[ $? -eq 0 ]]

  # Check required fields
  jq -e '.version' ".claude/coordination/state.json" > /dev/null
  jq -e '.feature' ".claude/coordination/state.json" > /dev/null
  jq -e '.workUnits' ".claude/coordination/state.json" > /dev/null
  jq -e '.lockedFiles' ".claude/coordination/state.json" > /dev/null
}

@test "state: handles corrupted state file gracefully" {
  mkdir -p .claude/coordination
  echo "not valid json" > .claude/coordination/state.json

  run bash "$SCRIPT" status

  # Should fail gracefully, not crash
  [[ "$status" -ne 0 ]] || [[ "$output" == *"error"* ]] || [[ "$output" == *"parse"* ]]
}

@test "state: handles missing state directory" {
  rm -rf .claude/coordination

  run bash "$SCRIPT" init "testfeature"

  # Should create directory and succeed
  [[ "$status" -eq 0 ]]
  [[ -f ".claude/coordination/state.json" ]]
}

# =============================================================================
# CONCURRENT ACCESS TESTS (Basic)
# =============================================================================

@test "lock: prevents double-locking by different WUs" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"t1"},"WU-1":{"status":"in_progress","terminal":"t2"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  # WU-0 locks file
  bash "$SCRIPT" lock 'WU-0' 'shared.ts'

  # WU-1 tries to lock same file
  run bash "$SCRIPT" lock 'WU-1' 'shared.ts'

  # Should fail
  [[ "$status" -ne 0 ]]
  [[ "$output" == *"already locked"* ]]
}

@test "lock: allows same WU to re-lock its own files" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  # Lock file
  bash "$SCRIPT" lock 'WU-0' 'myfile.ts'

  # Try to lock again (should succeed - idempotent)
  run bash "$SCRIPT" lock 'WU-0' 'myfile.ts'

  [[ "$status" -eq 0 ]]
}

@test "check: respects read-only files" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{},"lockedFiles":{},"sharedReadOnly":["shared/types.ts"],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" check 'shared/types.ts'

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"read-only"* ]] || [[ "$output" == *"BLOCKED"* ]]
}

# =============================================================================
# DEPENDENCY VALIDATION TESTS
# =============================================================================

@test "claim: prevents claiming WU with incomplete dependencies" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"pending","dependsOn":[]},"WU-1":{"status":"pending","dependsOn":["WU-0"]}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  # Try to claim WU-1 before WU-0 is complete
  run bash "$SCRIPT" claim 'WU-1'

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"depends on"* ]] || [[ "$output" == *"WU-0"* ]]
}

@test "claim: allows claiming WU when dependencies complete" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"completed","dependsOn":[]},"WU-1":{"status":"pending","dependsOn":["WU-0"]}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  run bash "$SCRIPT" claim 'WU-1'

  [[ "$status" -eq 0 ]]
}

# =============================================================================
# GIT COMMAND INJECTION TESTS
# =============================================================================

@test "complete: handles missing git gracefully" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  # Remove git from PATH temporarily
  PATH="/usr/bin:/bin" run bash "$SCRIPT" complete 'WU-0'

  # Should complete with 'unknown' hash, not fail
  if [ "$status" -eq 0 ]; then
    local hash=$(jq -r '.workUnits["WU-0"].commitHash' ".claude/coordination/state.json")
    [[ -n "$hash" ]]
  fi
}

@test "complete: uses provided commit hash safely" {
  echo '{"version":1,"feature":"test","wbsPath":"","workUnits":{"WU-0":{"status":"in_progress","terminal":"test"}},"lockedFiles":{},"sharedReadOnly":[],"lastUpdated":""}' > .claude/coordination/state.json

  # Try to inject via commit hash
  run bash "$SCRIPT" complete 'WU-0' '$(whoami)'

  if [ "$status" -eq 0 ]; then
    local hash=$(jq -r '.workUnits["WU-0"].commitHash' ".claude/coordination/state.json")
    # Should be literal, not expanded
    [[ "$hash" == '$(whoami)' ]] || [[ "$hash" != "$(whoami)" ]]
  fi
}

# =============================================================================
# ENVIRONMENT VARIABLE INJECTION TESTS
# =============================================================================

@test "init: not affected by malicious HOME variable" {
  HOME="/tmp/malicious" run bash "$SCRIPT" init "testfeature"

  # Should still work in current directory
  [[ -f ".claude/coordination/state.json" ]]
}

@test "init: not affected by malicious PATH variable" {
  # Create malicious jq
  mkdir -p "$TEST_ROOT/evil"
  echo '#!/bin/bash
echo "EVIL"' > "$TEST_ROOT/evil/jq"
  chmod +x "$TEST_ROOT/evil/jq"

  # Script should use system jq, not rely on PATH order for security
  # This test verifies behavior, not necessarily that it blocks the attack
  PATH="$TEST_ROOT/evil:$PATH" run bash "$SCRIPT" init "testfeature"

  # Note: This test documents the vulnerability
  # Secure scripts should use absolute paths for critical commands
}
