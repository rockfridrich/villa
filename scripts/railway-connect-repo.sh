#!/usr/bin/env bash
# Connect villa-production service to GitHub repo for auto-deploy

set -euo pipefail

echo "Connecting villa-production service to GitHub repo..."

# Set service
export RAILWAY_SERVICE="villa-production"

# Connect repo using CLI
echo "Running: railway repo connect rockfridrich/villa --branch main"
railway repo connect rockfridrich/villa --branch main

echo "Checking connection status..."
railway status

echo "Auto-deploy should now be configured!"
echo "Push a change to main branch to test."