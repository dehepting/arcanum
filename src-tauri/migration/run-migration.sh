#!/bin/bash

# Complete migration script - runs all migration steps in order

set -e  # Exit on error

echo "======================================"
echo "Arcanum: Supabase to SQLite Migration"
echo "======================================"
echo ""

# Check if node_modules exists
if [ ! -d "../../node_modules" ]; then
    echo "Error: node_modules not found. Run 'npm install' first."
    exit 1
fi

# Step 1: Export data from Supabase
echo "Step 1/3: Exporting data from Supabase..."
echo "---"
node export-from-supabase.js
echo ""

# Step 2: Download files from Supabase Storage
echo "Step 2/3: Downloading files from Supabase Storage..."
echo "---"
node download-files.js
echo ""

# Step 3: Summary
echo "Step 3/3: Migration data prepared!"
echo "---"
echo ""
echo "✓ Data exported to: ./data/"
echo "✓ Files downloaded to: ./files/"
echo ""
echo "Next steps:"
echo "1. Review exported data in ./data/"
echo "2. Run the Tauri app and use import commands"
echo "3. After import, run: node verify-migration.js"
echo ""
echo "Migration preparation complete!"
