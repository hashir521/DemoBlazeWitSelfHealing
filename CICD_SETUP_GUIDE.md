# CI/CD Setup Guide
## GitHub Actions + Groq for AI Self-Healing Tests

---

## How it works

```
LOCAL MACHINE                    GITHUB ACTIONS (CI/CD)
─────────────────                ──────────────────────
AI_PROVIDER=ollama               AI_PROVIDER=groq
Ollama at localhost:11434        Groq API at api.groq.com
Free, offline, private           Free tier, fast, cloud
No key needed                    GROQ_API_KEY in GitHub Secrets
```

Same tests. Same code. Different AI provider. Zero changes to test files.

---

## Step 1 — Get a free Groq API key

1. Go to **https://console.groq.com**
2. Sign up (free — no credit card needed)
3. Click **API Keys** in the left sidebar
4. Click **Create API Key**
5. Copy the key — it starts with `gsk_`
6. Save it somewhere safe — you only see it once

---

## Step 2 — Push your code to GitHub

### If you don't have a GitHub repo yet:

```bash
# 1. Go to https://github.com/new and create a new repository
#    Name it whatever you want
#    Keep it Private or Public — your choice
#    Do NOT initialise with README (you already have code)

# 2. In your project folder, run:
git init
git add .
git commit -m "Initial commit — AI self-healing Playwright framework"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### If you already have a GitHub repo:

```bash
git add .
git commit -m "Add AI self-healing framework with Groq CI/CD support"
git push
```

---

## Step 3 — Add GROQ_API_KEY to GitHub Secrets

This is how GitHub Actions gets your Groq key without it being in the code.

1. Go to your repository on GitHub
2. Click **Settings** tab (top of the repo page)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name:**  `GROQ_API_KEY`
   - **Value:** paste your key from Step 1 (starts with `gsk_`)
6. Click **Add secret**

```
Your repo
  └── Settings
        └── Secrets and variables
              └── Actions
                    └── New repository secret
                          Name:  GROQ_API_KEY
                          Value: gsk_xxxxxxxxxxxxxxxxxxxx
```

---

## Step 4 — Trigger the workflow

The workflow runs automatically on every push to `main`.

To trigger it manually:
1. Go to your repo on GitHub
2. Click the **Actions** tab
3. Click **Playwright Tests** in the left sidebar
4. Click **Run workflow** → **Run workflow**

---

## Step 5 — View results

After the workflow runs:

1. Click the **Actions** tab on GitHub
2. Click the latest workflow run
3. You will see:
   - ✅ Green = tests passed
   - ❌ Red = tests failed (click to see which ones)

4. Scroll down to **Artifacts** to download:
   - `playwright-report` — full HTML report with screenshots
   - `self-healing-report` — JSON report showing what was healed

---

## What the workflow does (step by step)

```
Trigger: push to main or pull request
         │
         ▼
1. Checkout code from GitHub
         │
         ▼
2. Set up Node.js 20
         │
         ▼
3. npm ci  (install exact versions from package-lock.json)
         │
         ▼
4. Install Chromium browser
         │
         ▼
5. Run E2E tests (demoblaze, signup)
   CI=true → headless mode, 2 retries on failure
         │
         ▼
6. Run self-healing tests
   AI_PROVIDER=groq → uses Groq instead of Ollama
   GROQ_API_KEY from GitHub Secrets
         │
         ▼
7. Upload playwright-report/ as artifact (kept 14 days)
         │
         ▼
8. Upload reports/test-report.json as artifact (kept 14 days)
```

---

## File structure added for CI/CD

```
.github/
  workflows/
    playwright.yml     ← the CI/CD pipeline definition

.env.example           ← documents required env vars (safe to commit)
.env                   ← your local values (gitignored, never committed)
```

---

## Local vs CI comparison

| | Local | CI/CD |
|---|---|---|
| AI Provider | Ollama | Groq |
| Model | llama3 | llama3-70b-8192 |
| API Key | Not needed | GROQ_API_KEY secret |
| Browser | Headed (visible) | Headless (no display) |
| Retries | 0 | 2 |
| How to run | `npm run test:headed` | Automatic on push |

---

## Troubleshooting CI failures

**"GROQ_API_KEY environment variable is not set"**
```
Fix: Add the secret in GitHub → Settings → Secrets and variables → Actions
     Name: GROQ_API_KEY
     Value: your key from console.groq.com
```

**"Groq API error 401"**
```
Fix: Your API key is wrong or expired
     Go to console.groq.com → API Keys → create a new one
     Update the GitHub secret
```

**"Groq API error 429"**
```
Fix: Rate limit hit (free tier: 14,400 requests/day, 30 req/min)
     Wait a minute and re-run, or reduce number of self-healing tests
```

**E2E tests fail but self-healing tests pass (or vice versa)**
```
The two test steps are independent.
Check the specific step that failed in the Actions tab.
Click the step to expand the logs.
```

**"headless" error or browser crash**
```
This should not happen — playwright.config.js now sets:
  headless: !!process.env.CI
So CI always runs headless automatically.
```

---

## Quick command reference

```bash
# Push code and trigger CI
git add .
git commit -m "your message"
git push

# Run locally with Ollama (default)
npm run test:headed

# Run locally with Groq (to test CI behaviour)
AI_PROVIDER=groq GROQ_API_KEY=gsk_... npm test

# Test Groq connection manually
AI_PROVIDER=groq GROQ_API_KEY=gsk_... node scripts/testOllama.js

# View last run report locally
npm run report
```

---

*Stack: Playwright + Ollama (local) + Groq (CI) + GitHub Actions*
