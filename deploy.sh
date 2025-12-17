#!/bin/bash

# Realm of Legends - Simple Auto-Deploy Script
# This script deploys to Vercel and automatically assigns your domain
# Automatically cleans up dist folders before deployment

echo "🚀 Deploying Realm of Legends..."
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

# Deploy to production
echo "📦 Building and deploying to Vercel..."
DEPLOYMENT_URL=$(vercel --prod --yes)

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Deployment URL: $DEPLOYMENT_URL"
    echo ""
    
    # Automatically assign domain alias
    echo "🌐 Assigning custom domain alias..."
    vercel alias "$DEPLOYMENT_URL" realmoflegends.info
    
    if [ $? -eq 0 ]; then
        echo "✅ Domain alias assigned successfully!"
        echo "🎯 Your site is live at: https://realmoflegends.info"
    else
        echo "⚠️  Domain alias assignment failed, but deployment is still successful"
        echo "🔗 Access your site at: $DEPLOYMENT_URL"
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
