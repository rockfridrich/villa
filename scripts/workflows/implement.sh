#!/bin/bash
# Enforced implementation workflow
# Usage: ./scripts/workflows/implement.sh <spec-path>

set -e

SPEC_PATH=$1

echo "🔒 ENFORCED IMPLEMENTATION PROTOCOL"
echo "===================================="

# Step 1: Validate spec exists
echo ""
echo "1️⃣  Checking spec..."
if [ -z "$SPEC_PATH" ]; then
  echo "❌ No spec provided"
  echo ""
  echo "Usage: $0 <spec-path>"
  echo ""
  echo "Available specs:"
  ls -1 specs/active/*.md 2>/dev/null || echo "  (none found)"
  echo ""
  echo "Create a spec first:"
  echo "  claude 'Create spec for <feature>'"
  exit 1
fi

if [ ! -f "$SPEC_PATH" ]; then
  echo "❌ Spec not found: $SPEC_PATH"
  echo ""
  echo "Available specs:"
  ls -1 specs/active/*.md 2>/dev/null || echo "  (none found)"
  exit 1
fi

echo "✅ Found: $SPEC_PATH"

# Step 2: Display spec summary
echo ""
echo "2️⃣  Spec summary:"
head -30 "$SPEC_PATH"
echo "..."
echo ""

# Step 3: Confirm delegation
echo "3️⃣  DELEGATION REQUIRED"
echo ""
echo "This implementation MUST be delegated to agents:"
echo ""
echo "  @build   - Write implementation code"
echo "  @test    - Write and run tests"
echo "  @review  - Review before commit"
echo "  @ops     - Commit and push"
echo ""
echo "Orchestrator (Opus) should NOT write code directly."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

# Step 4: Create task in beads
echo ""
echo "4️⃣  Creating task..."
TASK_ID=$(bd create --title "Implement: $(basename "$SPEC_PATH" .md)" --type task --priority 2 2>/dev/null | grep -o 'beads-[a-z0-9]*' || echo "manual")
echo "Task: $TASK_ID"

# Step 5: Output delegation commands
echo ""
echo "5️⃣  DELEGATION COMMANDS"
echo ""
echo "Run these in Claude Code:"
echo ""
echo "  @build 'Implement $SPEC_PATH - write code only, no tests'"
echo "  @test 'Write tests for $SPEC_PATH'"
echo "  @review 'Review implementation of $SPEC_PATH'"
echo "  @ops 'Commit implementation of $(basename "$SPEC_PATH" .md)'"
echo ""
echo "Or run all in parallel:"
echo ""
echo "  'Implement $SPEC_PATH using @build, @test, @review in parallel'"
echo ""
echo "✅ Implementation protocol initialized"
