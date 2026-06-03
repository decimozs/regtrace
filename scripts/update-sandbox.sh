#!/bin/bash
set -euo pipefail

echo "=== Updating sandbox binary ==="

# Build the CLI binary
echo "  Building regtrace..."
bun run build

# Copy to sandbox
echo "  Copying to sandbox/regtrace..."
cp ./regtrace ./sandbox/regtrace

echo "  Done. Binary updated in sandbox/"
echo ""
echo "  Run 'make -C sandbox help' to see available targets."
