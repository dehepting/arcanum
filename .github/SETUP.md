# CI/CD & Quality Control Setup

## Overview

Arcanum uses a **multi-layered quality control** system to catch issues early:

```
Pre-commit Hooks → GitHub Actions CI → Vercel Deployment
```

## Layer 1: Pre-commit Hooks (Catches issues BEFORE push)

**What it does:**
- Runs automatically when you `git commit`
- Checks only files you changed (fast!)
- Auto-formats code with Prettier
- Runs linter on staged files

**Tools:**
- **Husky**: Git hooks manager
- **lint-staged**: Runs commands on staged files only

**What gets checked:**
```bash
*.{js,jsx}   → oxlint + prettier --write
*.{json,css} → prettier --write
```

**Result:** Can't commit broken code. Auto-fixes formatting.

---

## Layer 2: GitHub Actions CI (Catches issues on push/PR)

**Workflow:** `.github/workflows/ci.yml`

**Runs on:**
- Every push to `main`
- Every pull request

**Checks (in order):**
1. ✅ **Security Audit** - Checks for vulnerable dependencies
2. ✅ **Format Check** - Ensures code is formatted
3. ✅ **Lint** - Catches code quality issues
4. ✅ **Build** - Verifies app compiles without errors
5. ✅ **Bundle Analysis** - Warns if bundle is too large

**Timeout:** 10 minutes max

**Artifacts:** Saves build output if build fails (for debugging)

**GitHub Secrets Required:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Layer 3: Dependabot (Keeps dependencies secure)

**What it does:**
- Creates PRs for dependency updates
- Groups minor/patch updates together
- Runs weekly for npm packages
- Runs monthly for GitHub Actions

**Benefits:**
- Security patches applied automatically
- Prevents dependency drift
- Each update gets CI checks before merge

---

## Layer 4: Pull Request Template

**What it does:**
- Enforces checklist for every PR
- Requires testing confirmation
- Asks for screenshots (UI changes)

**Location:** `.github/pull_request_template.md`

---

## Development Workflow

### Normal Development
```bash
# Make changes
git add .
git commit -m "Add feature"  # ← Pre-commit hooks run here
git push                     # ← CI runs on GitHub
```

If pre-commit fails:
- Fix the issues
- Try committing again

If CI fails:
- Check GitHub Actions tab
- Fix issues locally
- Push again

### Manual Checks
```bash
# Format all code
npm run format

# Check formatting (doesn't modify)
npm run format:check

# Run linter
npm run lint

# Build for production
npm run build

# Security audit
npm audit
```

---

## What Gets Caught

| Issue Type | Pre-commit | CI | Vercel |
|------------|------------|-------|---------|
| Syntax errors | ✅ | ✅ | ✅ |
| Unused variables | ✅ | ✅ | ✅ |
| Import errors | ❌ | ✅ | ✅ |
| Build failures | ❌ | ✅ | ✅ |
| Bad formatting | ✅ (auto-fix) | ✅ | - |
| Vulnerable deps | ❌ | ✅ | - |
| Large bundles | ❌ | ✅ (warns) | - |

---

## Bypassing Checks (Emergency Only)

**Skip pre-commit hooks:**
```bash
git commit --no-verify -m "Emergency fix"
```

**⚠️ Warning:** CI will still catch issues. Only use for emergencies.

---

## Best Practices

1. **Commit often** - Pre-commit is fast, catches issues early
2. **Check CI before requesting review** - Don't waste reviewer time
3. **Update dependencies weekly** - Review Dependabot PRs
4. **Keep PRs small** - Easier to review, faster CI
5. **Add screenshots** - Helps with UI reviews

---

## Troubleshooting

**Pre-commit hook not running?**
```bash
# Reinstall hooks
npm run prepare
```

**CI failing but works locally?**
- Check environment variables in GitHub secrets
- Try `npm ci` instead of `npm install` locally
- Check Node version (CI uses Node 20)

**Dependabot PRs failing?**
- Check if breaking changes in dependencies
- May need code updates before merging

---

## Future Improvements

Potential additions:
- [ ] Vitest for unit tests
- [ ] Playwright for E2E tests
- [ ] TypeScript for type safety
- [ ] Bundle size limits (enforced)
- [ ] Visual regression testing
- [ ] Lighthouse CI for performance

---

## Vercel Deployment

**Automatic deployments:**
- **Production**: Every push to `main` → arcanum.vercel.app
- **Preview**: Every PR → unique preview URL

**No setup needed** - already configured.

---

## Summary

This setup gives you:
- ✅ Fast feedback loop (pre-commit)
- ✅ Automated quality checks (CI)
- ✅ Security updates (Dependabot)
- ✅ Consistent code style (Prettier)
- ✅ Build verification before deploy
- ✅ No broken code reaches production

**Result:** High confidence in code quality, catches 90% of issues before review.
