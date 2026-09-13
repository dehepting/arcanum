# CI/CD Setup

## GitHub Secrets

To enable the CI workflow, add these secrets to your GitHub repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Add the following secrets:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Workflows

### CI (`ci.yml`)
Runs on every push and PR:
- ✅ Lints code with oxlint
- ✅ Builds the project
- ✅ Checks for build errors

### Dependabot
- Automatically creates PRs for dependency updates
- Groups minor/patch updates together
- Weekly schedule for npm packages
- Monthly for GitHub Actions

## Development Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting (doesn't modify files)
npm run format:check

# Build for production
npm run build
```

## Vercel Deployment

Vercel automatically deploys:
- **Production**: Every push to `main`
- **Preview**: Every PR

No additional setup needed - already configured.
