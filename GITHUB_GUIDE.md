# GitHub Workflow Guide for Beginners

## Quick Reference Scripts

### 1. `git-update.bat` - Push Your Changes
**When to use:** After you've made changes and want to update GitHub

**What it does:**
- Shows you what files changed
- Asks for a description of your changes
- Commits and pushes to GitHub automatically

**Usage:**
```bash
git-update.bat
```

---

### 2. `git-new-branch.bat` - Create a New Feature Branch
**When to use:** Starting work on a new feature or bug fix

**What it does:**
- Creates a new branch
- Switches you to that branch
- Keeps your main branch clean

**Usage:**
```bash
git-new-branch.bat
```

---

## Understanding GitHub Basics

### What is a Branch?
Think of branches like parallel versions of your code:
- **main** - Your production code (what's live)
- **feature branches** - Where you develop new features safely

### Why Use Branches?
- Keep experimental code separate from working code
- Multiple people can work on different features
- Easy to undo if something breaks

---

## Common Workflows

### Workflow 1: Quick Update to Main Branch
```
1. Make your changes in the code
2. Run: git-update.bat
3. Enter a description like "Fixed login bug"
4. Done! Changes are on GitHub
```

### Workflow 2: Working on a New Feature
```
1. Run: git-new-branch.bat
2. Name it: "feature-chat-system" or "fix-profile-page"
3. Make your changes
4. Run: git-update.bat to push the feature branch
5. Later: Merge the branch into main (see below)
```

---

## Manual Git Commands (What the scripts do)

### Check what changed
```bash
git status
```

### Save your changes (commit)
```bash
git add .
git commit -m "Your description here"
```

### Send to GitHub (push)
```bash
git push origin main
```

### Create a new branch
```bash
git checkout -b feature-name
```

### Switch between branches
```bash
git checkout main          # Switch to main
git checkout feature-name  # Switch to your feature
```

### See all branches
```bash
git branch -a
```

### Merge a feature branch into main
```bash
git checkout main           # Switch to main
git merge feature-name      # Merge your feature
git push origin main        # Push merged code
```

---

## Best Practices

### 1. Commit Often
- Save your work frequently
- Each commit should be one logical change
- Write clear commit messages

**Good messages:**
- "Add user authentication"
- "Fix profile image upload bug"
- "Update homepage layout"

**Bad messages:**
- "Update"
- "Changes"
- "asdf"

### 2. Use Branches for Features
- `main` = stable code
- `feature-<name>` = new features
- `fix-<name>` = bug fixes
- `test-<name>` = experimental code

### 3. Pull Before You Push
If working with others, always get the latest code first:
```bash
git pull origin main
```

---

## Troubleshooting

### "Push failed" or "rejected"
Someone else pushed changes. Update your local code:
```bash
git pull origin main
git push origin main
```

### Accidentally committed to wrong branch
```bash
git checkout correct-branch  # Switch to right branch
git cherry-pick <commit-id>  # Copy the commit
```

### Want to undo last commit (before pushing)
```bash
git reset HEAD~1
```

### See commit history
```bash
git log --oneline
```

### Discard all local changes (careful!)
```bash
git reset --hard HEAD
```

---

## GitHub Web Interface

### Creating a Pull Request (PR)
1. Push your feature branch: `git push origin feature-name`
2. Go to GitHub.com → Your Repository
3. Click "Compare & pull request"
4. Add description of changes
5. Click "Create pull request"
6. Review and merge when ready

### Viewing Your Code Online
- Visit: https://github.com/astroverse4223-lab/GSH
- Browse files, see commit history
- Check branches dropdown

---

## Quick Cheat Sheet

| Task | Command |
|------|---------|
| Save changes | `git-update.bat` |
| New feature | `git-new-branch.bat` |
| Check status | `git status` |
| See branches | `git branch -a` |
| Switch branch | `git checkout branch-name` |
| Get latest code | `git pull origin main` |
| See history | `git log --oneline` |

---

## Need Help?

- Run any script to see what it does
- Check `git status` anytime to see where you are
- You can't break GitHub - your code is safe!
- Worst case: clone a fresh copy from GitHub

**Your Repository:** https://github.com/astroverse4223-lab/GSH
