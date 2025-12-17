#!/bin/bash

# Simple Deploy Script - Reliable deployment with auto domain assignment
# Works cross-platform and handles URL extraction properly

echo "🚀 Deploying Realm of Legends (Auto Mode)..."
echo ""

# Clean up dist folders first
echo "🧹 Cleaning dist folders..."
find ./src -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./pages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./components -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./lib -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
[ -d "./dist" ] && rm -rf "./dist"
echo "✅ Cleanup complete"
echo ""

# Deploy and capture output
echo "📦 Deploying to Vercel..."
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    # Extract deployment URL - try multiple patterns
    DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*vercel\.app' | tail -1)
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        # Fallback: look for Production line
        DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep "Production:" | sed 's/.*Production: *//' | tr -d ' ')
    fi
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        echo "⚠️  Deployment successful but couldn't extract URL automatically"
        echo "📋 Deploy output:"
        echo "$DEPLOY_OUTPUT"
        echo ""
        echo "Please run manually: vercel alias <deployment-url> realmoflegends.info"
        exit 1
    fi
    
    echo "✅ Deployment successful!"
    echo "🔗 Deployment URL: $DEPLOYMENT_URL"
    echo ""
    
    # Assign domain alias
    echo "🌐 Assigning domain alias..."
    vercel alias "$DEPLOYMENT_URL" realmoflegends.info
    
    if [ $? -eq 0 ]; then
        echo "✅ Domain assigned successfully!"
        echo "🎯 Your site is live at: https://realmoflegends.info"
    else
        echo "⚠️  Domain alias failed, but deployment successful"
        echo "🔗 Manual alias command: vercel alias $DEPLOYMENT_URL realmoflegends.info"
    fi
    
else
    echo "❌ Deployment failed!"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo ""
echo "🎉 Auto-deployment complete!"
