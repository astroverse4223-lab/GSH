# 🚀 Developer Scripts Guide

This file documents all the custom scripts added to your project for a faster, smoother workflow.

---

## 🗂️ Script List & Usage

### 1. `dev-setup.bat`

**Purpose:** Complete development environment setup

- Kills old Node processes
- Cleans dist folders and Next.js cache
- Installs dependencies if missing
- Starts the dev server
- **Run:** `npm run setup`

### 2. `quick-deploy.bat`

**Purpose:** Build, test, and deploy in one step

- Cleans everything
- Tests build
- Deploys if build succeeds
- **Run:** `npm run quick`

### 3. `health-check.bat`

**Purpose:** Full system health check

- Checks dependencies, build, environment, database
- Warns about common issues
- **Run:** `npm run health`

### 4. `debug-helper.bat`

**Purpose:** Troubleshooting assistant

- Creates a debug report
- Finds common problems
- Suggests quick fixes
- **Run:** `npm run debug`

### 5. `git-commit.bat`

**Purpose:** Smart git commits

- Auto-generates commit messages
- Handles push to remote
- **Run:** `npm run commit`

### 6. `project-menu.bat`

**Purpose:** Interactive menu for all actions

- Lets you choose any script or open your site
- **Run:** `npm run menu`

---

## ⚡ Quick Reference

| Script Name      | NPM Command    | What It Does                          |
| ---------------- | -------------- | ------------------------------------- |
| dev-setup.bat    | npm run setup  | Full dev setup, clean, start server   |
| quick-deploy.bat | npm run quick  | Build, test, deploy, show live URL    |
| health-check.bat | npm run health | System health check, catch issues     |
| debug-helper.bat | npm run debug  | Debug report, troubleshooting         |
| git-commit.bat   | npm run commit | Smart git commit and push             |
| project-menu.bat | npm run menu   | Interactive menu for all actions      |
| clean-dist.bat   | npm run clean  | Clean dist folders (fix build errors) |

---

## 🏁 Typical Workflow

1. **Start dev:** `npm run setup`
2. **Check health:** `npm run health`
3. **Deploy:** `npm run quick`
4. **Commit changes:** `npm run commit`
5. **Debug:** `npm run debug`
6. **Menu:** `npm run menu`

---

## 💡 Pro Tips

- All scripts are in your project root for easy access
- You can run any `.bat` file directly or via npm
- The menu script is a great way to access everything fast
- These scripts work on Windows (for Mac/Linux, use the `.sh` equivalents)

---

**Keep this file handy for reference!**
