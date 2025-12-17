#!/bin/bash

# Realm of Legends - Smart Deploy Script
# Only deploys when there are changes, handles domain alias automatically
# Automatically cleans up dist folders before deployment

echo "🚀 Realm of Legends Smart Deploy"
echo ""

# Clean up dist folders that cause build issues
echo "🧹 Cleaning up dist folders..."
find ./src -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./pages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./components -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./lib -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
# Remove top-level dist folder if it exists
[ -d "./dist" ] && rm -rf "./dist"
echo "✅ Dist folders cleaned"
echo ""

# Check if there are any changes since last deploy
LAST_DEPLOY_FILE=".last-deploy"
CURRENT_HASH=$(find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.css" -o -name "*.json" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.vercel/*" | xargs ls -la | md5sum | cut -d' ' -f1)

if [ -f "$LAST_DEPLOY_FILE" ]; then
    LAST_HASH=$(cat "$LAST_DEPLOY_FILE")
    if [ "$CURRENT_HASH" = "$LAST_HASH" ]; then
        echo "📝 No changes detected since last deployment"
        echo "🎯 Your site is already up to date at: https://realmoflegends.info"
        exit 0
    fi
fi

echo "📦 Changes detected, deploying to Vercel..."
echo ""

# Deploy to production
DEPLOYMENT_URL=$(vercel --prod --yes 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    # Extract the URL from the output (last line usually contains the URL)
    DEPLOYMENT_URL=$(echo "$DEPLOYMENT_URL" | grep -o 'https://[^[:space:]]*vercel.app' | tail -1)
    
    echo "✅ Deployment successful!"
    echo "🔗 Deployment URL: $DEPLOYMENT_URL"
    echo ""
    
    # Automatically assign domain alias
    echo "🌐 Assigning custom domain alias..."
    vercel alias "$DEPLOYMENT_URL" realmoflegends.info
    
    if [ $? -eq 0 ]; then
        echo "✅ Domain alias assigned successfully!"
        echo "🎯 Your site is live at: https://realmoflegends.info"
        
        # Save the current hash
        echo "$CURRENT_HASH" > "$LAST_DEPLOY_FILE"
        echo "📝 Deployment hash saved for future change detection"
    else
        echo "⚠️  Domain alias assignment failed, but deployment is still successful"
        echo "🔗 Access your site at: $DEPLOYMENT_URL"
    fi
else
    echo "❌ Deployment failed!"
    echo "$DEPLOYMENT_URL"
    
    # Check if it's a rate limit error
    if echo "$DEPLOYMENT_URL" | grep -q "try again in"; then
        echo ""
        echo "💡 You've hit Vercel's free tier limit (100 deployments/day)"
        echo "⏰ Wait for the cooldown or consider upgrading to Pro plan"
        echo ""
        echo "🛠️  Alternative options:"
        echo "   • Wait for the rate limit to reset"
        echo "   • Only deploy when you have significant changes"
        echo "   • Use 'vercel dev' for local development testing"
    fi
    
    exit 1
fi

echo ""
echo "🎉 Smart deployment complete!"
