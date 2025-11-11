# GitHub Guide for Complete Beginners
## Everything You Need to Know About GitHub (Explained Like You're 5)

**Created:** 2025-11-11 16:30 MYT (Asia/Kuala_Lumpur)
**For:** AI Bradaa Project
**Your Level:** Zero GitHub knowledge (we'll fix that!)
**Status:** Complete Reference Guide

---

## 🎯 Table of Contents

1. [What is GitHub? (Simple Explanation)](#1-what-is-github-simple-explanation)
2. [Your Current Repository Situation](#2-your-current-repository-situation)
3. [GitHub Vocabulary (Words You Need to Know)](#3-github-vocabulary-words-you-need-to-know)
4. [How GitHub Works (The Big Picture)](#4-how-github-works-the-big-picture)
5. [Step-by-Step: Clean Up Your Branches](#5-step-by-step-clean-up-your-branches)
6. [Step-by-Step: Create a Pull Request](#6-step-by-step-create-a-pull-request)
7. [Step-by-Step: Merge to Main](#7-step-by-step-merge-to-main)
8. [GitHub Workflows (Your Daily Operations)](#8-github-workflows-your-daily-operations)
9. [Common Problems & Solutions](#9-common-problems--solutions)
10. [GitHub Best Practices](#10-github-best-practices)
11. [Quick Reference Commands](#11-quick-reference-commands)

---

## 1. What is GitHub? (Simple Explanation)

### **Think of GitHub Like Google Drive... But for Code**

Imagine you're writing a book:
- **Google Docs** = Where you write one version at a time
- **GitHub** = Where you can have MANY versions at the same time, and easily switch between them

### **What GitHub Does:**

1. **Saves your work** (like hitting Ctrl+S, but forever)
2. **Lets you try new ideas** without breaking the working version
3. **Keeps a history** of every change (so you can go back in time)
4. **Lets multiple people work** on the same project without conflicts
5. **Shows what changed** (like Google Docs "Version History" but way more powerful)

### **Real-World Example:**

**Without GitHub:**
```
MyProject_final.zip
MyProject_final_v2.zip
MyProject_final_v2_REALLY_FINAL.zip
MyProject_final_v2_REALLY_FINAL_THIS_TIME.zip  😅
```

**With GitHub:**
- You just have `MyProject`
- GitHub remembers all versions automatically
- You can jump back to ANY version instantly

---

## 2. Your Current Repository Situation

### **What You Have Right Now:**

```
📦 aibradaa (Your Repository)
├── 📂 main branch (your new default, like the "master copy")
│   └── Last updated: From previous work
│
├── 🌿 claude/phase-11-repo-audit-consolidation-... (CURRENT BRANCH)
│   └── Contains: All your Phase 11 work (Netlify fix + documentation)
│   └── 7 commits ahead of main
│
├── 🌿 claude/pricing-audit-backend-011CUxGSfMhBQtrLE5hppPpR
│   └── Status: Old work, already merged
│
├── 🌿 claude/pricing-audit-backend-setup-011CUv22U3UzPGFNezcYaJoT
│   └── Status: Another branch
│
└── 🤖 dependabot/* (15 branches)
    └── Automatic dependency updates (safe to ignore for now)
```

### **What Needs to Happen:**

**Goal:** Get your Phase 11 work (documentation + Netlify fix) into the `main` branch

**Steps:**
1. ✅ **You're here** → Phase 11 work complete on feature branch
2. ⏳ **Next** → Create Pull Request (PR)
3. ⏳ **Then** → Merge PR to main
4. ⏳ **Finally** → Clean up old branches

---

## 3. GitHub Vocabulary (Words You Need to Know)

### **Essential Terms (Learn These First)**

| Term | Simple Explanation | Real-World Example |
|------|-------------------|-------------------|
| **Repository (Repo)** | A project folder with all your files + history | Your entire `aibradaa` project |
| **Branch** | A separate version of your project | Like writing a rough draft vs final draft |
| **Commit** | Saving a snapshot of your work | Like clicking "Save Version" in Google Docs |
| **Push** | Upload your work from computer → GitHub | Like clicking "Upload" to Google Drive |
| **Pull** | Download work from GitHub → computer | Like clicking "Download" from Google Drive |
| **Main Branch** | The official, working version | The final published version of your book |
| **Feature Branch** | A branch where you work on new stuff | Your rough draft where you try new ideas |
| **Pull Request (PR)** | Asking to merge your work into main | Like asking an editor to publish your draft |
| **Merge** | Combining two branches together | Like copying your draft into the final book |
| **Remote** | GitHub's copy (on the internet) | The version stored online |
| **Local** | Your computer's copy | The version on your laptop |

### **The Branch Naming Convention:**

**Your current branch:** `claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL`

**What it means:**
- `claude/` = Created by Claude (AI assistant)
- `phase-11-repo-audit-consolidation` = What you're working on
- `011CV1G4CQrG8zZyw4UnhNWL` = Unique session ID (so branches don't conflict)

**Why so long?** Because Claude Code creates unique branch names automatically to prevent conflicts.

---

## 4. How GitHub Works (The Big Picture)

### **The GitHub Workflow (Simplified)**

```
┌─────────────────────────────────────────────────────────────┐
│                     GITHUB WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

Step 1: CREATE A BRANCH
   main ──→ (create branch) ──→ feature-branch

   "I want to try a new idea without breaking main"

Step 2: MAKE CHANGES & COMMIT
   feature-branch:
      Edit files
      ↓
      git commit (save snapshot)
      ↓
      Edit more files
      ↓
      git commit (save another snapshot)

Step 3: PUSH TO GITHUB
   Your Computer ──→ (git push) ──→ GitHub

   "Upload my work so it's saved online"

Step 4: CREATE PULL REQUEST
   feature-branch ──→ (PR) ──→ Request to merge into main

   "I'm done! Can we add this to main?"

Step 5: REVIEW & MERGE
   Review code
   ↓
   Approve
   ↓
   Merge feature-branch → main

   "Looks good! Let's make it official"

Step 6: DELETE BRANCH
   Delete feature-branch (cleanup)

   "We don't need this branch anymore"
```

### **Visual Example:**

```
BEFORE:
main:        A──B──C
feature:            └──D──E──F

AFTER MERGE:
main:        A──B──C──D──E──F
feature:     (deleted)
```

**What happened?**
- `main` had commits A, B, C
- You created `feature` branch from C
- You added commits D, E, F on `feature`
- You merged `feature` into `main`
- Now `main` has all commits A through F
- `feature` branch is deleted (no longer needed)

---

## 5. Step-by-Step: Clean Up Your Branches

### **Goal:** Remove old branches you don't need anymore

**Before we start, let's understand what to delete:**

✅ **SAFE TO DELETE:**
- Old `claude/*` branches that are already merged
- Dependabot branches you don't need

❌ **DO NOT DELETE:**
- `main` (your default branch)
- Your current branch (Phase 11 work)
- Any branch with work you haven't merged yet

---

### **5.1 Check Which Branches Are Merged**

Run this command:
```bash
cd /home/user/aibradaa
git branch -r --merged origin/main
```

**What this does:** Shows branches already merged into `main` (safe to delete)

**Example output:**
```
origin/claude/old-branch-123
origin/claude/another-old-branch-456
```

---

### **5.2 Delete Old Claude Branches (After This PR is Merged)**

**⚠️ IMPORTANT: Only do this AFTER you merge your Phase 11 PR to main!**

**Step 1:** List all claude branches
```bash
git branch -r | grep claude
```

**Step 2:** Delete old merged branches (one at a time)
```bash
# Replace BRANCH_NAME with the actual branch name
git push origin --delete claude/pricing-audit-backend-011CUxGSfMhBQtrLE5hppPpR
```

**Example:**
```bash
# After Phase 11 is merged, delete this branch:
git push origin --delete claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL
```

**Step 3:** Delete local copies
```bash
git branch -d claude/pricing-audit-backend-011CUxGSfMhBQtrLE5hppPpR
```

---

### **5.3 Clean Up Dependabot Branches (Optional)**

**What are dependabot branches?**
- Automatic pull requests to update your dependencies (like npm packages)
- Created by GitHub's "Dependabot" robot

**Should you delete them?**
- **If you merged the PR:** Yes, delete the branch
- **If you ignored the PR:** Yes, delete the branch (or merge it first if you want the update)

**How to delete:**
```bash
# Delete on GitHub
git push origin --delete dependabot/npm_and_yarn/prettier-tw-3.6.2

# Or delete ALL dependabot branches at once (be careful!)
git branch -r | grep dependabot | sed 's/origin\///' | xargs -I {} git push origin --delete {}
```

**⚠️ Warning:** Only run the "delete all" command if you're sure you don't need those updates!

---

## 6. Step-by-Step: Create a Pull Request

### **What is a Pull Request (PR)?**

Think of it like this:
- You wrote a new chapter for a book (your feature branch)
- Now you want to add it to the published book (main branch)
- A Pull Request is like asking the editor: "Can we publish this chapter?"

### **6.1 Using GitHub Website (Easiest Method)**

**Step 1:** Go to your GitHub repository
```
https://github.com/aibradaa-labs/aibradaa
```

**Step 2:** You'll see a yellow banner at the top:
```
┌────────────────────────────────────────────────────────┐
│ claude/phase-11-repo-audit-consolidation-... had      │
│ recent pushes 5 minutes ago                            │
│                                    [Compare & pull request] │
└────────────────────────────────────────────────────────┘
```

**Step 3:** Click **"Compare & pull request"** button

**Step 4:** Fill out the PR form:

**Title:**
```
Phase 11: Repository Audit, Netlify Fix & World-Class Documentation
```

**Description:**
```markdown
## Summary
This PR completes Phase 11 - Repository Audit & Consolidation

## What's Included

### 🔧 Critical Fix
- **Netlify Deployment:** Fixed initialization failure (package.json + build script)

### 📚 World-Class Documentation (6 Documents, 6,700+ lines)
1. ARCHITECTURE.md - Complete file-by-file system architecture
2. docs/MULTI_CATEGORY_EXPANSION_STRATEGY.md - Laptops→Cameras→Smartphones→Gadgets
3. docs/N8N_EVALUATION_REPORT.md - Workflow automation evaluation
4. docs/DATABASE_SCHEMA_SPECIFICATION.md - Neon PostgreSQL schema
5. docs/TIER_SYSTEM_SPECIFICATION.md - 3-tier pricing system
6. docs/SECURITY_IMPLEMENTATION_ROADMAP.md - Production security

### 📝 Other Updates
- .env.example with 150+ environment variables
- Updated GitHub workflows (support main + claude/** branches)
- AGENT.md contributor guide (1,083 lines)
- CHANGELOG.md with Phase 11 details

## Testing
- ✅ Build script runs successfully (200ms, 174 files)
- ✅ All Netlify functions syntax validated
- ✅ GitHub workflows passing

## Commits (7 total)
- b9ccb59: docs: Complete Phase 11.10B documentation (Part 2)
- cc94484: docs: Add Phase 11.10B documentation (Part 1)
- 8b04963: fix: Resolve Netlify deployment initialization failure
- bf1da89: docs: Update CHANGELOG
- 0340161: feat: Add .env.example
- ddc7348: fix: Update GitHub workflows
- 9c944d5: feat: Phase 11 initial commit

## How to Review
1. Check ARCHITECTURE.md for system overview
2. Review Netlify fixes in package.json and tools/build-netlify.mjs
3. Browse docs/ folder for all specifications

## Related Issues
Fixes Netlify deployment initialization failure
```

**Step 5:** Set the **base** and **compare** branches:
- **base:** `main` (where you want to merge TO)
- **compare:** `claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL` (your current branch)

**Step 6:** Review the changes (GitHub will show you a diff)

**Step 7:** Click **"Create pull request"** button

**Step 8:** Wait for GitHub Actions to run (automated checks)
- You'll see green checkmarks ✅ if everything passes
- Or red X ❌ if something fails

---

### **6.2 Using Command Line (Alternative Method)**

**Prerequisite:** Install GitHub CLI
```bash
# If gh is not installed, you'll need to ask your system admin
# or use the GitHub website method above (easier!)
```

**Command:**
```bash
cd /home/user/aibradaa

gh pr create \
  --base main \
  --head claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL \
  --title "Phase 11: Repository Audit, Netlify Fix & World-Class Documentation" \
  --body "See description above"
```

**Note:** The GitHub website method is easier for beginners!

---

## 7. Step-by-Step: Merge to Main

### **After Your PR is Created**

**Step 1:** Wait for checks to pass
- GitHub Actions will run automatically
- You'll see status like: "All checks have passed ✅"

**Step 2:** Review the PR (Optional but Recommended)
- Click through the "Files changed" tab
- Make sure nothing looks wrong
- Check that all your documentation files are there

**Step 3:** Merge the PR

**Option A: Merge on GitHub Website**

1. Go to your PR page
2. Scroll down to the bottom
3. You'll see a green button: **"Merge pull request"**
4. Click it
5. Choose merge method:
   - **Create a merge commit** (Recommended for you)
   - Squash and merge (Combines all commits into one)
   - Rebase and merge (Advanced, skip for now)
6. Click **"Confirm merge"**
7. Click **"Delete branch"** (cleans up the feature branch)

**Option B: Merge via Command Line**

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge your feature branch
git merge claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL

# Push to GitHub
git push origin main

# Delete the feature branch (cleanup)
git branch -d claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL
git push origin --delete claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL
```

---

### **Step 4:** Verify the Merge

**Check on GitHub:**
1. Go to `https://github.com/aibradaa-labs/aibradaa`
2. Make sure you're on the `main` branch (dropdown at top left)
3. You should see your latest commit message
4. Check that all your files are there (ARCHITECTURE.md, docs/, etc.)

**Check locally:**
```bash
git checkout main
git pull origin main
ls -la  # You should see all your files
```

---

## 8. GitHub Workflows (Your Daily Operations)

### **8.1 Starting a New Feature**

```bash
# 1. Make sure you're on main and it's up-to-date
git checkout main
git pull origin main

# 2. Create a new branch
git checkout -b my-new-feature

# 3. Make your changes (edit files)
# ...

# 4. Save your changes (commit)
git add .
git commit -m "feat: Add my new feature"

# 5. Push to GitHub
git push -u origin my-new-feature

# 6. Create a Pull Request (on GitHub website)
# 7. Merge when ready
# 8. Delete branch after merge
```

---

### **8.2 Making Changes to an Existing Feature**

```bash
# 1. Make sure you're on the right branch
git checkout my-feature-branch

# 2. Edit files
# ...

# 3. Commit changes
git add .
git commit -m "fix: Update feature"

# 4. Push to GitHub
git push origin my-feature-branch
```

---

### **8.3 Syncing with Latest Main**

**When to do this:** If `main` branch has new changes and you want them in your feature branch

```bash
# 1. Commit your current work first
git add .
git commit -m "wip: Save current progress"

# 2. Switch to main and update
git checkout main
git pull origin main

# 3. Go back to your feature branch
git checkout my-feature-branch

# 4. Merge main into your branch
git merge main

# 5. Fix any conflicts (if needed)
# 6. Push
git push origin my-feature-branch
```

---

### **8.4 Checking Your Status (Use This Often!)**

```bash
# Where am I? What's changed?
git status

# What commits have I made?
git log --oneline -10

# What branches exist?
git branch -a

# What's different from GitHub?
git fetch origin
git status
```

---

## 9. Common Problems & Solutions

### **Problem 1: "I'm on the wrong branch!"**

**Symptoms:**
```
$ git status
On branch some-random-branch
```

**Solution:**
```bash
# Switch to main
git checkout main

# Or switch to your feature branch
git checkout claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL
```

---

### **Problem 2: "I made changes but forgot to commit!"**

**Symptoms:**
```
$ git status
Changes not staged for commit:
  modified: some-file.js
```

**Solution:**
```bash
# Save your changes
git add .
git commit -m "feat: Describe what you changed"
git push origin <your-branch-name>
```

---

### **Problem 3: "Git says my branch is behind!"**

**Symptoms:**
```
Your branch is behind 'origin/main' by 5 commits
```

**Solution:**
```bash
# Update your local copy
git pull origin main
```

---

### **Problem 4: "Merge conflict!"**

**Symptoms:**
```
CONFLICT (content): Merge conflict in file.js
Automatic merge failed; fix conflicts and then commit the result.
```

**Solution:**
```bash
# 1. Open the conflicted file
# 2. Look for markers like this:
<<<<<<< HEAD
Your changes
=======
Someone else's changes
>>>>>>> main

# 3. Edit the file to keep what you want
# 4. Remove the markers (<<<, ===, >>>)
# 5. Save the file
# 6. Mark as resolved:
git add file.js
git commit -m "fix: Resolve merge conflict"
git push
```

---

### **Problem 5: "I pushed to the wrong branch!"**

**Solution:**
```bash
# Don't panic! Git never loses data.
# Create a new branch from your current state:
git checkout -b correct-branch-name

# Push to the correct branch:
git push -u origin correct-branch-name

# Now create a PR from correct-branch-name
```

---

### **Problem 6: "How do I undo my last commit?"**

**If you HAVEN'T pushed yet:**
```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit AND discard changes (⚠️ DANGER!)
git reset --hard HEAD~1
```

**If you HAVE pushed:**
```bash
# Create a new commit that undoes the last one
git revert HEAD
git push origin <branch-name>
```

---

### **Problem 7: "My branch name is too long to type!"**

**Solution:** Use tab completion!
```bash
# Type first few characters, then press TAB
git checkout claude/pha[TAB]
# Expands to: git checkout claude/phase-11-repo-audit-consolidation-...
```

---

## 10. GitHub Best Practices

### **✅ DO:**

1. **Commit often** (every logical change)
   - Good: 10 small commits
   - Bad: 1 giant commit with 1000 changes

2. **Write clear commit messages**
   ```
   ✅ Good: "fix: Resolve Netlify deployment initialization failure"
   ❌ Bad: "fixed stuff"
   ```

3. **Use descriptive branch names**
   ```
   ✅ Good: feature/add-camera-module
   ❌ Bad: temp, fix, asdf123
   ```

4. **Pull before you push**
   ```bash
   git pull origin main  # Always sync first
   git push origin my-branch
   ```

5. **Delete branches after merging**
   - Keeps your repo clean
   - Prevents confusion

6. **Create PRs for every feature**
   - Even if you're working alone
   - Good documentation
   - Easy to review later

---

### **❌ DON'T:**

1. **Don't commit secrets** (.env files, API keys, passwords)
2. **Don't force push to main** (`git push --force` on main = disaster!)
3. **Don't work directly on main** (always use a feature branch)
4. **Don't commit large files** (>100MB = slow downloads)
5. **Don't use vague commit messages** ("update", "fix", "changes")
6. **Don't leave branches unmerged** for weeks (merge or delete)

---

## 11. Quick Reference Commands

### **Essential Commands (Memorize These)**

```bash
# See what's changed
git status

# Create a new branch
git checkout -b new-branch-name

# Switch branches
git checkout branch-name

# Save changes (commit)
git add .
git commit -m "your message here"

# Upload to GitHub
git push origin branch-name

# Download from GitHub
git pull origin branch-name

# See commit history
git log --oneline -10

# See all branches
git branch -a

# Delete a branch (local)
git branch -d branch-name

# Delete a branch (GitHub)
git push origin --delete branch-name
```

---

### **Advanced Commands (For Later)**

```bash
# See what changed in a file
git diff file-name

# Undo uncommitted changes
git checkout -- file-name

# See who changed what (blame)
git blame file-name

# Search commit messages
git log --grep="keyword"

# Cherry-pick a commit from another branch
git cherry-pick commit-hash

# Stash changes (temporary save)
git stash
git stash pop  # Restore later

# See remote URLs
git remote -v

# Add a new remote
git remote add upstream https://github.com/...
```

---

## 12. Your Current Situation - Action Plan

### **What to Do RIGHT NOW:**

**Step 1: Create the Pull Request** (5 minutes)
```bash
# You're already on the right branch, so just:
# 1. Go to GitHub website: https://github.com/aibradaa-labs/aibradaa
# 2. Click the yellow "Compare & pull request" button
# 3. Fill out the title and description (use templates from Section 6)
# 4. Click "Create pull request"
```

**Step 2: Wait for Checks to Pass** (5-10 minutes)
- GitHub Actions will run automatically
- Check that workflows pass (green ✅)

**Step 3: Merge the PR** (2 minutes)
```bash
# On GitHub website:
# 1. Click "Merge pull request"
# 2. Click "Confirm merge"
# 3. Click "Delete branch" (cleanup)
```

**Step 4: Update Your Local Repository** (1 minute)
```bash
cd /home/user/aibradaa
git checkout main
git pull origin main

# Verify everything is there
ls -la ARCHITECTURE.md
ls -la docs/
```

**Step 5: Clean Up Old Branches** (5 minutes)
```bash
# Delete the Phase 11 branch (it's merged now)
git branch -d claude/phase-11-repo-audit-consolidation-011CV1G4CQrG8zZyw4UnhNWL

# Delete old merged branches
git push origin --delete claude/pricing-audit-backend-011CUxGSfMhBQtrLE5hppPpR
```

---

### **Your Repository After Cleanup:**

```
📦 aibradaa
├── 📂 main (DEFAULT - up to date with Phase 11 work)
├── 🌿 claude/pricing-audit-backend-setup-... (if you still need it)
└── 🤖 dependabot/* (optional - can delete if not using)
```

**Result:** Clean, organized repository with all work on `main`! ✅

---

## 13. Emergency Contacts & Resources

### **If You Get Stuck:**

1. **Check git status first:**
   ```bash
   git status
   ```
   This tells you 90% of what you need to know!

2. **Check this guide** (you're reading it!)

3. **Ask Claude Code:**
   - "Claude, I'm on branch X and I want to do Y, how?"
   - Claude knows Git/GitHub and can help!

4. **GitHub Docs:**
   - https://docs.github.com/en/get-started/quickstart

5. **Learn Git Branching (Interactive):**
   - https://learngitbranching.js.org/

---

### **Important Files in Your Repo:**

| File/Folder | What It Is | Can I Delete? |
|-------------|-----------|---------------|
| `.git/` | Git database (history) | ❌ NO! You'll lose everything |
| `.github/` | GitHub workflows | ❌ NO! CI/CD needs this |
| `node_modules/` | npm packages | ✅ Yes (but it regenerates on `npm install`) |
| `dist/` | Build output | ✅ Yes (regenerates on `npm run build`) |
| `.env` | Secrets | ❌ NO! (but don't commit it to Git!) |
| `.env.example` | Template | ❌ NO! Others need this |
| `package.json` | Dependencies | ❌ NO! Critical file |
| `README.md` | Documentation | ❌ NO! Project overview |

---

## 14. Glossary (A-Z)

| Term | Meaning |
|------|---------|
| **Branch** | A separate line of development |
| **Clone** | Copy a repository to your computer |
| **Commit** | A saved snapshot of your work |
| **Conflict** | When two changes clash (need manual fix) |
| **Fork** | Your personal copy of someone else's repo |
| **HEAD** | The current commit you're looking at |
| **Merge** | Combine two branches |
| **Origin** | The default name for your GitHub remote |
| **Pull** | Download changes from GitHub |
| **Pull Request (PR)** | Request to merge your work |
| **Push** | Upload changes to GitHub |
| **Rebase** | Rewrite commit history (advanced) |
| **Remote** | A version of your repo on another server |
| **Repository** | A project with Git tracking |
| **Staging Area** | Files ready to be committed |
| **Stash** | Temporarily save uncommitted changes |
| **Tag** | A label for a specific commit (like v1.0.0) |
| **Upstream** | The original repo (if you forked) |
| **Working Directory** | The files you see in your folder |

---

## 15. Cheat Sheet (Print This!)

```
╔════════════════════════════════════════════════════════════╗
║            GITHUB CHEAT SHEET FOR BEGINNERS               ║
╚════════════════════════════════════════════════════════════╝

BASIC WORKFLOW:
1. git status               → See what's changed
2. git add .                → Stage all changes
3. git commit -m "message"  → Save snapshot
4. git push origin branch   → Upload to GitHub

CREATE NEW FEATURE:
1. git checkout main        → Go to main branch
2. git pull origin main     → Get latest
3. git checkout -b new-feat → Create new branch
4. (edit files)
5. git add .
6. git commit -m "feat: ..."
7. git push -u origin new-feat
8. (create PR on GitHub website)

SEE WHAT'S HAPPENING:
git status      → Current state
git log -10     → Recent commits
git branch -a   → All branches
git diff        → What changed

FIX PROBLEMS:
git pull origin main           → Update from GitHub
git checkout -- file.js        → Undo changes to file
git reset --soft HEAD~1        → Undo last commit
git stash                      → Save work temporarily
git stash pop                  → Restore stashed work

DELETE BRANCHES:
git branch -d branch-name                  → Delete local
git push origin --delete branch-name       → Delete on GitHub

EMERGENCY:
git status  → Always run this first!
(then check this guide or ask Claude)
```

---

**END OF GUIDE**

**Remember:**
- Git is SAFE - it's very hard to actually lose work
- When in doubt, run `git status`
- Ask Claude Code for help anytime!
- This guide is your friend - bookmark it!

**Last Updated:** 2025-11-11 16:30 MYT
**For:** AI Bradaa Project
**Author:** Claude Code AI Assistant

---

## Quick Links

- [Your Repository](https://github.com/aibradaa-labs/aibradaa)
- [GitHub Docs](https://docs.github.com/)
- [Learn Git Branching](https://learngitbranching.js.org/)
- [Git Cheat Sheet PDF](https://education.github.com/git-cheat-sheet-education.pdf)
