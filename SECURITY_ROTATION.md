# Secret Rotation and Git History Purge

This repository previously committed real credentials in `application.properties` and frontend config. **P0 removed them from the working tree**, but **git history may still contain secrets**.

## 1. Rotate secrets (do this first)

Generate new values and update your deployment secrets (`.env`, CI, hosting provider):

| Secret | Action |
|--------|--------|
| Database password | Change MySQL user password; update `DB_PASSWORD` |
| JWT secret | Generate new ≥64 char random string; update `JWT_SECRET` (invalidates all sessions) |
| Gmail app password | Revoke old app password; create new; update `MAIL_PASSWORD` |
| IPQS API key | Rotate in IPQualityScore dashboard; update `IPQS_API_KEY` |
| Google Maps API key | Create new key with HTTP referrer restrictions; update `GOOGLE_MAPS_API_KEY` |
| Twilio | Rotate auth token if ever committed |

## 2. Purge secrets from git history (manual)

**Warning:** Rewriting history requires force-push and coordination with all collaborators.

### Option A: BFG Repo-Cleaner (recommended)

```bash
# Install BFG, clone a fresh mirror
git clone --mirror git@github.com:YOUR_ORG/OjtFinalProject.git
cd OjtFinalProject.git

# Replace known leaked strings (example patterns — use your actual old values)
bfg --replace-text passwords.txt

# Or delete specific files from all commits
bfg --delete-files application.properties

git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### Option B: git-filter-repo

```bash
pip install git-filter-repo
git filter-repo --path backend/Ecommerce/src/main/resources/application.properties --invert-paths
git push origin main --force
```

## 3. After purge

1. Confirm GitHub secret scanning / gitleaks CI passes on new commits.
2. Invalidate all outstanding JWTs (already done if you rotated `JWT_SECRET`).
3. Audit access logs for abuse during exposure window.

## 4. Do NOT

- Commit `.env` files
- Put API keys in `index.html` or source (use environment/build injection)
- Share rotation artifacts in issues or PR comments
