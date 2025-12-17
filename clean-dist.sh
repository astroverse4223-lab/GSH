#!/bin/bash

# Realm of Legends - Dist Folder Cleanup Script
# Removes all problematic dist folders that cause build failures

echo "🧹 Cleaning up dist folders..."
echo ""

# Count existing dist folders first
DIST_COUNT=$(find ./src ./pages ./components ./lib -name "dist" -type d 2>/dev/null | wc -l)
if [ -d "./dist" ]; then
    DIST_COUNT=$((DIST_COUNT + 1))
fi

if [ $DIST_COUNT -eq 0 ]; then
    echo "✅ No dist folders found - project is already clean!"
    exit 0
fi

echo "🔍 Found $DIST_COUNT dist folders to remove:"
find ./src ./pages ./components ./lib -name "dist" -type d 2>/dev/null
[ -d "./dist" ] && echo "./dist"
echo ""

# Remove dist folders
echo "🗑️  Removing dist folders..."
find ./src -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./pages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./components -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./lib -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
[ -d "./dist" ] && rm -rf "./dist"

echo "✅ Cleanup complete! Removed $DIST_COUNT dist folders"
echo ""
echo "💡 These folders were causing TypeScript build failures"
echo "🚀 Your project is now ready for deployment"
