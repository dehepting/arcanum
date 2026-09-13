# GitHub Repository Setup Instructions

## 1. Enable Branch Protection (CRITICAL)

**Why:** Prevents merging broken code to main

**Steps:**
1. Go to: https://github.com/dehepting/arcanum/settings/branches
2. Click "Add rule" or "Add branch protection rule"
3. In "Branch name pattern" enter: `main`
4. Check these boxes:
   ✅ Require a pull request before merging
   ✅ Require status checks to pass before merging
      - Click "Add check" and search for "quality-checks"
      - Select it (this is your CI workflow)
   ✅ Require branches to be up to date before merging
   ✅ Do not allow bypassing the above settings
5. Scroll down and click "Create" or "Save changes"

**Result:** Can't merge PRs if CI fails

---

## 2. Enable Dependabot Alerts

**Why:** Get notified of security vulnerabilities

**Steps:**
1. Go to: https://github.com/dehepting/arcanum/settings/security_analysis
2. Enable these:
   ✅ Dependency graph (should be on by default)
   ✅ Dependabot alerts
   ✅ Dependabot security updates
3. Dependabot version updates should auto-enable (we have dependabot.yml)

**Result:** Get PRs for security patches automatically

---

## 3. Configure Pull Request Settings

**Why:** Better PR workflow

**Steps:**
1. Go to: https://github.com/dehepting/arcanum/settings
2. Scroll to "Pull Requests" section
3. Configure:
   ✅ Allow squash merging (keeps main branch clean)
   ❌ Allow merge commits (optional, up to you)
   ❌ Allow rebase merging (optional, up to you)
   ✅ Automatically delete head branches (cleans up after merge)

**Result:** Cleaner git history

---

## 4. Enable GitHub Actions (Should be on)

**Why:** Required for CI to run

**Steps:**
1. Go to: https://github.com/dehepting/arcanum/settings/actions
2. Under "Actions permissions" select:
   ⚪ Allow all actions and reusable workflows
3. Under "Workflow permissions" select:
   ⚪ Read and write permissions
4. Check:
   ✅ Allow GitHub Actions to create and approve pull requests

**Result:** CI workflows can run

---

## 5. Verify Secrets Are Set (Already Done ✅)

**Why:** CI needs these to build

**Steps:**
1. Go to: https://github.com/dehepting/arcanum/settings/secrets/actions
2. Verify you see:
   ✅ VITE_SUPABASE_URL
   ✅ VITE_SUPABASE_ANON_KEY

**Result:** Build step works in CI

---

## Optional but Recommended

### A. Add Repository Description & Topics

**Steps:**
1. Go to: https://github.com/dehepting/arcanum
2. Click ⚙️ (gear icon) next to "About"
3. Add description: "Dark scholarly research IDE for archaeological investigation"
4. Add topics: `research`, `archaeology`, `pdf-viewer`, `mapping`, `react`, `vite`
5. Save

### B. Enable Issue Templates

**Steps:**
1. Go to: https://github.com/dehepting/arcanum/settings
2. Scroll to "Features"
3. Check: ✅ Issues
4. We can add templates later if needed

---

## Testing the Setup

After configuring, test by creating a test PR:

```bash
# Create a new branch
git checkout -b test-ci

# Make a small change
echo "# Testing CI" >> README.md
git add README.md
git commit -m "Test: verify CI runs"
git push -u origin test-ci

# Go to GitHub and create a PR from test-ci to main
# You should see:
# - PR template appears automatically
# - CI checks start running
# - "quality-checks" shows in PR checks
```

---

## What You'll See

**On every PR:**
- 🔄 CI check running (orange dot)
- ✅ CI check passed (green checkmark) or ❌ failed (red X)
- Merge button disabled until checks pass (if you enabled branch protection)

**Weekly:**
- Dependabot PRs for dependency updates

**On security issues:**
- Alert in Security tab
- Dependabot PR with fix

---

## Quick Checklist

After completing setup, you should have:
- ✅ Branch protection on `main`
- ✅ CI required to pass before merge
- ✅ Dependabot enabled
- ✅ Auto-delete merged branches
- ✅ Secrets configured (already done)
- ✅ Actions enabled
