# XP Toast Notification System - Integration Guide

## 🎉 Overview

The XP notification system now includes automatic toast notifications that appear when users gain XP or level up! This makes the progression system much more engaging and visible to users.

## 🔧 How to Use

### 1. Import the Hook

```tsx
import { useXPNotifications } from "@/hooks/useXPNotifications";
```

### 2. Use in Components

```tsx
const { awardPostCreationXP, awardCommentXP, awardReactionXP } =
  useXPNotifications();

// Award XP with automatic toast notification
await awardPostCreationXP();
```

## 📱 Available Functions

### Content Actions

- `awardPostCreationXP()` - +5 XP for creating posts
- `awardCommentXP()` - +2 XP for adding comments
- `awardReactionXP()` - +1 XP for giving reactions
- `awardStoryCreationXP()` - +3 XP for creating stories

### Social Actions

- `awardFriendXP()` - +10 XP for adding friends
- `awardGroupJoinXP()` - +15 XP for joining groups
- `awardGroupCreationXP()` - +25 XP for creating groups
- `awardBoostXP()` - +8 XP for boosting posts

### Gaming Actions

- `awardGamePlayXP()` - +5 XP for playing games
- `awardGameWinXP()` - +20 XP for winning games
- `awardStreamStartXP()` - +15 XP for starting streams

### Other Actions

- `awardProfileUpdateXP()` - +5 XP for updating profile
- `awardMarketplaceXP("list"|"purchase")` - +10/+5 XP for marketplace
- `awardDailyLoginXP()` - +10 XP for daily login
- `awardContentEngagementXP(type, count)` - Bonus XP for popular content

## 🎨 Toast Notifications

### Regular XP Gains

- Shows for 3-4 seconds
- Format: "⚡ +{amount} XP earned!"
- Success color theme

### Level Ups

- Shows for 6 seconds
- Format: "🎉 Level Up! You've reached Level {level} and gained {xp} XP!"
- Celebration theme with longer duration

### Special Rewards

- Daily Login: "📅 Daily Login Bonus: +{xp} XP earned!"
- Content Engagement: "🔥 Popular Content Bonus: +{xp} XP!"
- Level Up with Bonus: "🎉 Daily Login Bonus! Level Up to {level}! Total: +{xp} XP"

## 🔗 Integration Examples

### In PostCard Component

```tsx
// Replace old system
const { autoAwardXP } = useEnhancedXP(); // OLD
await autoAwardXP("reaction_given"); // OLD

// With new system
const { awardReactionXP } = useXPNotifications(); // NEW
await awardReactionXP(); // NEW - Shows toast automatically!
```

### In Game Components

```tsx
const { awardGamePlayXP, awardGameWinXP } = useXPNotifications();

// When game starts
const startGame = async () => {
  // Game logic...
  await awardGamePlayXP(); // Shows "⚡ +5 XP earned!"
};

// When player wins
const handleGameWin = async () => {
  // Win logic...
  await awardGameWinXP(); // Shows "⚡ +20 XP earned!" or level up message
};
```

### In Group Components

```tsx
const { awardGroupJoinXP, awardGroupCreationXP } = useXPNotifications();

// When joining a group
const joinGroup = async () => {
  // Join logic...
  await awardGroupJoinXP(); // Shows "⚡ +15 XP earned!"
};

// When creating a group
const createGroup = async () => {
  // Creation logic...
  await awardGroupCreationXP(); // Shows "⚡ +25 XP earned!" or level up
};
```

### In Profile Components

```tsx
const { awardProfileUpdateXP } = useXPNotifications();

const updateProfile = async () => {
  // Update logic...
  await awardProfileUpdateXP(); // Shows "⚡ +5 XP earned!"
};
```

### In Marketplace Components

```tsx
const { awardMarketplaceXP } = useXPNotifications();

const listItem = async () => {
  // Listing logic...
  await awardMarketplaceXP("list"); // Shows "⚡ +10 XP earned!"
};

const purchaseItem = async () => {
  // Purchase logic...
  await awardMarketplaceXP("purchase"); // Shows "⚡ +5 XP earned!"
};
```

## 🎯 Best Practices

### 1. Call After Success

Always call XP functions after the main action succeeds:

```tsx
const createPost = async () => {
  try {
    const response = await fetch("/api/posts", {
      /* ... */
    });
    if (response.ok) {
      // Only award XP if post creation succeeded
      await awardPostCreationXP();
    }
  } catch (error) {
    // Don't award XP on error
  }
};
```

### 2. Don't Duplicate Awards

Avoid calling XP functions multiple times for the same action:

```tsx
// ❌ BAD - Multiple XP awards for same action
await awardPostCreationXP();
await awardPostCreationXP(); // Duplicate!

// ✅ GOOD - Single XP award
await awardPostCreationXP();
```

### 3. Use Appropriate Functions

Use the specific function for each action:

```tsx
// ❌ BAD - Generic function
await autoAwardXP("post_created");

// ✅ GOOD - Specific function
await awardPostCreationXP();
```

## 🚀 Already Integrated

The system is already integrated in:

- ✅ PostCard.tsx (reactions and comments)
- ✅ Post creation API
- ✅ XP Dashboard (test functions)

## 📍 Where to Integrate Next

Add XP notifications to these areas:

- 🔄 Group join/create forms
- 🔄 Friend request acceptance
- 🔄 Profile update forms
- 🔄 Game completion handlers
- 🔄 Marketplace actions
- 🔄 Stream start buttons
- 🔄 Story creation forms
- 🔄 Daily login handlers

## 🧪 Testing

Visit `/debug` page to test all XP notification functions and see how the toast system works!

## 💡 Technical Notes

The toast system is already set up with the ToastProvider in the app layout, so you just need to call the XP functions and the notifications will appear automatically.

The underlying `useEnhancedXP` hook handles:

- Server-side XP calculation
- Level progression logic
- Bonus multipliers (premium, weekends, streaks)
- Database updates
- Progress refresh

The `useXPNotifications` hook adds the toast layer on top of this solid foundation.
