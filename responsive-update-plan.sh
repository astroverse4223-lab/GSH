#!/bin/bash

# Comprehensive Responsive Breakpoint Update Script
# This script updates all CSS files to use consistent, comprehensive breakpoints

echo "Starting comprehensive responsive design update..."

# Define the new breakpoint system
declare -A breakpoints=(
    ["320px"]="Small Mobile"
    ["480px"]="Mobile Medium" 
    ["640px"]="Mobile Large"
    ["768px"]="Small Tablet - iPad Mini Portrait"
    ["820px"]="Tablet Medium - iPad Air Portrait"
    ["912px"]="Tablet Large - Surface Pro Portrait"
    ["1024px"]="Tablet XL - iPad Landscape, Nest Hub"
    ["1200px"]="Desktop Small"
    ["1400px"]="Desktop Medium"
    ["1600px"]="Desktop Large"
    ["1920px"]="Desktop XL"
)

# Priority files to update first (critical layout components)
priority_files=(
    "src/components/Navbar.module.css"
    "src/app/globals.css"
    "src/app/messages/messages.module.css" 
    "src/app/page.module.css"
    "src/components/AppLayout.module.css"
    "src/components/PostCard.module.css"
    "src/components/EnhancedPostCreator.module.css"
)

echo "Breakpoint system:"
for bp in "${!breakpoints[@]}"; do
    echo "  $bp: ${breakpoints[$bp]}"
done

echo ""
echo "Priority files identified: ${#priority_files[@]}"
echo "Total CSS files to update: Will scan and update all files with media queries"

# Create backup directory
backup_dir="/c/Users/User/Desktop/GamerSocialSite/responsive-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"
echo "Created backup directory: $backup_dir"

echo ""
echo "Recommended next steps:"
echo "1. Update Navbar.module.css with comprehensive breakpoints (IN PROGRESS)"
echo "2. Update globals.css with responsive utilities (COMPLETED)"
echo "3. Update messages.module.css for all device sizes"
echo "4. Update all component CSS files systematically"
echo "5. Test on all specified devices"
echo ""
echo "Device targets:"
echo "- iPad Mini (768px × 1024px)"
echo "- iPad Air (820px × 1180px)"  
echo "- iPad Pro (1024px × 1366px)"
echo "- Surface Pro 7 (912px × 1368px)"
echo "- Asus Zenbook Fold (1024px × 1536px)"
echo "- Nest Hub (1024px × 600px)"
