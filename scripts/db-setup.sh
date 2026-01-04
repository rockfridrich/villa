#!/bin/bash
# Villa Database Setup Script
# Creates DigitalOcean Managed PostgreSQL and configures it

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Villa Database Setup${NC}"
echo "====================="
echo ""

# Check prerequisites
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}Error: doctl is not installed${NC}"
    echo "Install with: brew install doctl"
    exit 1
fi

if ! doctl auth list &> /dev/null; then
    echo -e "${RED}Error: doctl is not authenticated${NC}"
    echo "Run: doctl auth init"
    exit 1
fi

# Configuration
DB_NAME="${DB_NAME:-villa-db}"
DB_ENGINE="pg"
DB_VERSION="17"
DB_SIZE="${DB_SIZE:-db-s-1vcpu-1gb}"
DB_REGION="${DB_REGION:-nyc1}"
DB_NODES="${DB_NODES:-1}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Name:    $DB_NAME"
echo "  Engine:  PostgreSQL $DB_VERSION"
echo "  Size:    $DB_SIZE"
echo "  Region:  $DB_REGION"
echo "  Nodes:   $DB_NODES"
echo ""

# Check if database already exists
EXISTING=$(doctl databases list --format Name --no-header | grep -w "$DB_NAME" || true)
if [[ -n "$EXISTING" ]]; then
    echo -e "${GREEN}Database '$DB_NAME' already exists${NC}"

    # Get connection info
    DB_ID=$(doctl databases list --format ID,Name --no-header | grep "$DB_NAME" | awk '{print $1}')
    echo ""
    echo -e "${BLUE}Connection Details:${NC}"
    doctl databases connection "$DB_ID" --format Host,Port,User,Database,SSL

    echo ""
    echo -e "${YELLOW}To get the full connection string:${NC}"
    echo "  doctl databases connection $DB_ID"

    exit 0
fi

# Create database
echo -e "${YELLOW}Creating database...${NC}"
echo "This may take 5-10 minutes."
echo ""

doctl databases create "$DB_NAME" \
    --engine "$DB_ENGINE" \
    --version "$DB_VERSION" \
    --size "$DB_SIZE" \
    --region "$DB_REGION" \
    --num-nodes "$DB_NODES" \
    --wait

echo ""
echo -e "${GREEN}Database created successfully!${NC}"
echo ""

# Get database ID
DB_ID=$(doctl databases list --format ID,Name --no-header | grep "$DB_NAME" | awk '{print $1}')

# Get connection info
echo -e "${BLUE}Connection Details:${NC}"
doctl databases connection "$DB_ID" --format Host,Port,User,Database,SSL

echo ""
echo -e "${YELLOW}Connection String:${NC}"
CONNECTION=$(doctl databases connection "$DB_ID" --format URI --no-header)
echo "$CONNECTION"

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add to .env:"
echo "   DATABASE_URL=\"$CONNECTION\""
echo ""
echo "2. Run migrations:"
echo "   cd apps/api && pnpm db:push"
echo ""
echo "3. Configure firewall (restrict to VPC):"
echo "   doctl databases firewalls append $DB_ID --rule vpc:\$VPC_UUID"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
