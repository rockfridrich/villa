#!/usr/bin/env bash

# Test script to demonstrate health endpoints with build info

echo "Testing health endpoints locally..."

# Start hub app
echo "Starting hub app..."
cd apps/hub
bun dev &
HUB_PID=$!
cd ../..

# Wait for startup
sleep 5

# Test health endpoint
echo ""
echo "Testing hub health endpoint:"
curl -s http://localhost:3000/api/health | jq .

# Cleanup
echo ""
echo "Cleaning up..."
kill $HUB_PID 2>/dev/null

echo ""
echo "Health endpoint test complete!"
echo ""
echo "Production endpoints can be tested with:"
echo "./scripts/verify-deployment.sh -v"