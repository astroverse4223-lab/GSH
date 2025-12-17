# 🚀 Automatic Deployment Setup

Your Realm of Legends site now has **automatic domain alias assignment** without needing GitHub! Here's how it works:

## ✅ What's Now Automated

- ✅ **Voice Chat link removed** from footer
- ✅ **Domain alias automatically assigned** (`realmoflegends.info`)
- ✅ **Smart deployment** - only deploys when there are changes
- ✅ **Rate limit protection** - warns about Vercel free tier limits
- ✅ **Automatic dist folder cleanup** - prevents build failures

## 🛠️ How to Deploy (3 Easy Ways)

### Option 1: Smart Deploy (Recommended)

**Windows:**

```bash
smart-deploy.bat
```

**Mac/Linux:**

```bash
./smart-deploy.sh
```

### Option 2: NPM Script (Fixed!)

```bash
npm run deploy:auto
```

### Option 3: Manual Deploy

```bash
vercel --prod --yes
vercel alias realmoflegends.info
```

## 🧠 Smart Features

### Change Detection

- Only deploys when files have actually changed
- Saves deployment quota on free tier
- Creates `.last-deploy` file to track changes

### Automatic Domain Assignment

- Every deployment automatically gets assigned to `realmoflegends.info`
- No more manual `vercel alias` commands!
- Works with the `vercel.json` configuration

### Rate Limit Protection

- Detects Vercel free tier limits (100 deployments/day)
- Provides helpful error messages and solutions
- Suggests alternatives when limit is hit

## 📁 Files Added

- `vercel.json` - Automatic domain alias configuration
- `smart-deploy.sh` / `smart-deploy.bat` - Intelligent deployment scripts
- `deploy.sh` / `deploy.bat` - Simple deployment scripts
- Updated `package.json` with deployment scripts

## 🎯 How It Works

1. **vercel.json** tells Vercel to automatically assign your domain aliases
2. **Smart deploy scripts** check for changes before deploying
3. **Automatic alias assignment** happens after every successful deployment
4. **No GitHub required** - everything works locally with Vercel CLI

## ⚡ Quick Start

From now on, just run:

```bash
smart-deploy.bat
```

And your site will:

1. ✅ Clean up any problematic dist folders
2. ✅ Check for changes
3. ✅ Deploy only if needed
4. ✅ Automatically assign realmoflegends.info domain
5. ✅ Show you the live URL

## 🧹 Automatic Dist Folder Cleanup

**The Problem**: Sometimes TypeScript compilation creates `dist` folders in your source code that cause build failures with messages like:

```
Type error: Page "src/app/api/auth/dist/[...nextauth].js" does not match the required types of a Next.js Page.
```

**The Solution**: All deployment scripts now automatically clean these up!

**What Gets Cleaned**:

- `./src/**/dist` folders
- `./pages/**/dist` folders
- `./components/**/dist` folders
- `./lib/**/dist` folders
- Top-level `./dist` folder

**Manual Cleanup** (if needed):

```bash
# Windows
clean-dist.bat

# Mac/Linux
./clean-dist.sh

# Or via npm
npm run clean
```

No more manual steps or build failures! 🎉
