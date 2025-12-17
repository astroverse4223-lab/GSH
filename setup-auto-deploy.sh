#!/bin/bash

# Realm of Legends - Vercel Auto-Deployment Setup
# This script helps you set up automatic deployments with GitHub Actions

echo "🚀 Setting up automatic deployments for Realm of Legends..."
echo ""

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo "❌ This is not a git repository. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git branch -M main"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

echo "✅ Git repository detected"
echo ""

echo "📋 To complete the setup, you need to add these secrets to your GitHub repository:"
echo ""
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings > Secrets and variables > Actions"
echo "3. Add the following repository secrets:"
echo ""

# Get Vercel project info
echo "🔍 Getting your Vercel project information..."
echo ""

if command -v vercel &> /dev/null; then
    echo "VERCEL_TOKEN: (Your personal Vercel token)"
    echo "   - Go to https://vercel.com/account/tokens"
    echo "   - Create a new token with appropriate permissions"
    echo ""
    
    # Try to get project ID
    if [ -f ".vercel/project.json" ]; then
        PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)
        
        echo "VERCEL_PROJECT_ID: $PROJECT_ID"
        echo "VERCEL_ORG_ID: $ORG_ID"
    else
        echo "VERCEL_PROJECT_ID: (Run 'vercel link' first to get this)"
        echo "VERCEL_ORG_ID: (Run 'vercel link' first to get this)"
    fi
else
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
fi

echo ""
echo "🔧 Setup Instructions:"
echo ""
echo "1. Install Vercel CLI (if not already installed):"
echo "   npm install -g vercel"
echo ""
echo "2. Link your project to Vercel:"
echo "   vercel link"
echo ""
echo "3. Add the GitHub secrets listed above"
echo ""
echo "4. Push your changes to trigger the first automated deployment:"
echo "   git add ."
echo "   git commit -m 'Add automatic deployment setup'"
echo "   git push"
echo ""
echo "✨ Benefits of this setup:"
echo "   • Automatic deployments on every push to main"
echo "   • Automatic domain alias assignment (realmoflegends.info)"
echo "   • Preview deployments for pull requests" 
echo "   • No more manual 'vercel alias' commands needed!"
echo ""
echo "🎯 Once set up, every push to main will:"
echo "   1. Build your project"
echo "   2. Deploy to Vercel"
echo "   3. Automatically assign realmoflegends.info domain"
echo "   4. Report the deployment URL"
echo ""
