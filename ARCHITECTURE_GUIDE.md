# AI Self-Healing Playwright Framework — Architecture Guide

> Your complete reference for understanding the system, explaining it to others,
> and answering interview questions confidently.

---

## 1. Folder Structure — What lives where and why

```
project-root/
│
├── ai-service/                  ← Everything AI-related
│   ├── ollamaClient.js          ← HTTP client for Ollama (local only)
│   ├── aiClient.js              ← Provider router: Ollama (local) or Groq (CI)
│   ├── locatorAgent.js          ← The AI brain (prompt + reasoning)
│   └── reportAgent.js           ← Converts logs into reports
│
├── utils/                       ← Shared utilities used by tests
│   └── selfHeal.js              ← Orchestrates the full healing flow
│
├── tests/                       ← All Playwright test files
│   ├── pages/                   ← Page Object Model (POM) classes
│   │   ├── BasePage.js          ← Shared helpers all pages inherit
│   │   ├── LoginPage.js         ← Login modal actions
│   │   ├── NavbarPage.js        ← Navbar actions
│   │   ├── HomePage.js          ← Product listing actions
│   │   ├── CartPage.js          ← Cart actions
│   │   └── ...
│   ├── fixtures/
│   │   └── stress-page.html     ← Local HTML for stress tests
│   ├── selfHealing.spec.js      ← 8 real-world healing scenarios
│   ├── stressHealing.spec.js    ← 10 stress/edge case scenarios
│   ├── demoblaze.spec.js        ← Original E2E tests (demoblaze)
│   └── signup_scroll.spec.js    ← Signup + scroll test
│
├── scripts/                     ← Manual debug/test scripts
│   ├── testOllama.js            ← Test active AI provider (Ollama or Groq)
│   └── testLocator.js           ← Test locatorAgent directly
│
├── .github/
│   └── workflows/
│       └── playwright.yml       ← GitHub Actions CI/CD pipeline
│
├── reports/
│   └── test-report.json         ← Auto-generated after each run
│
├── playwright.config.js         ← Playwright settings (browser, timeout, etc.)
├── package.json                 ← Project dependencies and npm scripts
├── .env.example                 ← Documents required env vars (safe to commit)
└── .gitignore                   ← Keeps node_modules, .env, reports out of git
```

---

## 2. Each File — One Sentence Responsibility

| File | Responsibility |
|---|---|
| `ollamaClient.js` | Send a prompt to local Ollama, return raw text. Nothing else. |
| `aiClient.js` | Route to Ollama (local) or Groq (CI) based on `AI_PROVIDER` env var. |
| `locatorAgent.js` | Build a smart prompt, call `askAI`, clean the output, return a selector. |
| `selfHeal.js` | Run the 5-step healing flow, log every event, call the report. |
| `reportAgent.js` | Take the log array, print a summary, save to test-report.json. |
| `selfHealing.spec.js` | 8 Playwright tests with intentionally broken locators on saucedemo. |
| `stressHealing.spec.js` | 10 harder scenarios: hidden elements, delayed load, dynamic IDs, etc. |
| `BasePage.js` | Shared Playwright helpers (click, fill, scroll) all page objects use. |
| `playwright.config.js` | Browser settings, timeouts, reporters, base URL. |
| `package.json` | npm scripts: npm test, npm run test:headed, npm run report. |
| `.github/workflows/playwright.yml` | CI/CD pipeline — runs tests on GitHub using Groq for AI. |
| `.env.example` | Documents `AI_PROVIDER` and `GROQ_API_KEY` variables (safe to commit). |
| `scripts/testOllama.js` | Quick manual check: tests whichever AI provider is currently active. |
| `scripts/testLocator.js` | Quick manual check: does locatorAgent return a valid selector? |

---

## 3. The 5-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLAYWRIGHT TEST                             │
│              selfHealing.spec.js / stressHealing.spec.js        │
│                                                                 │
│   page.goto(url)  →  fill credentials  →  selfHeal(...)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SELF-HEAL UTILITY                            │
│                      utils/selfHeal.js                          │
│                                                                 │
│  Orchestrates the full recovery flow + logging + reporting      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ calls
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────┐    ┌────────────────────────┐
│   LOCATOR AGENT     │    │    REPORT AGENT         │
│ ai-service/         │    │  ai-service/            │
│ locatorAgent.js     │    │  reportAgent.js         │
│                     │    │                         │
│ Builds prompt       │    │ Converts logs →         │
│ Calls askAI()       │    │ console summary +       │
│ Sanitises output    │    │ reports/test-report.json│
└──────────┬──────────┘    └────────────────────────┘
           │ calls
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI CLIENT (ROUTER)                           │
│                   ai-service/aiClient.js                        │
│                                                                 │
│   AI_PROVIDER=ollama → ollamaClient   (local, default)          │
│   AI_PROVIDER=groq   → Groq API       (CI/CD)                   │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────────┐
│   OLLAMA CLIENT      │    │   GROQ API                          │
│ ollamaClient.js      │    │   api.groq.com                      │
│                      │    │                                     │
│ localhost:11434      │    │ model: llama3-70b-8192              │
│ model: llama3        │    │ requires: GROQ_API_KEY              │
│ free, offline        │    │ free tier, fast, cloud              │
└──────────────────────┘    └─────────────────────────────────────┘
```

---

## 4. The Complete Execution Flow

### You run:
```bash
npx playwright test tests/selfHealing.spec.js
```

### What happens step by step:

```
playwright.config.js is read
→ browser: Chromium, headless: false, timeout: 90s
         │
         ▼
selfHealing.spec.js starts
beforeAll() → clearReport()  clears reports/test-report.json
         │
         ▼
TEST: "Scenario 1 — Wrong XPath id on login button"

  1. page.goto("https://www.saucedemo.com")
  2. page.locator('#user-name').fill('standard_user')   ← correct locator
  3. page.locator('#password').fill('secret_sauce')     ← correct locator
  4. selfHeal(page, "//button[@id='loginn']", clickFn)  ← BROKEN locator
         │
         ▼
╔══════════════════════════════════════════════════════════════╗
║  selfHeal.js — THE ORCHESTRATOR                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  STEP 1: Try original locator                                ║
║  page.locator("//button[@id='loginn']").click()              ║
║  ❌ FAILS — Timeout 10000ms exceeded                          ║
║  failureKind = "timeout"                                     ║
║  log → { event: "original_failed", failureKind: "timeout" } ║
║                                                              ║
║  STEP 2: Ask AI for a fix                                    ║
║  dom = page.content()  ← full HTML of the page              ║
║  fixLocator("//button[@id='loginn']", dom)                   ║
║                                                              ║
║  STEP 3: Validate AI locator                                 ║
║  page.locator('[data-test="login-button"]').count() → 1      ║
║  ✅ PASS                                                      ║
║  log → { event: "validation", validation: "passed" }         ║
║                                                              ║
║  STEP 4: Retry with AI locator                               ║
║  page.locator('[data-test="login-button"]').click()          ║
║  ✅ SUCCESS                                                   ║
║  log → { event: "outcome", status: "healed" }                ║
║                                                              ║
║  STEP 5: Generate report                                     ║
║  generateReport(logs, "S1: Wrong XPath id")                  ║
╚══════════════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════╗
║  locatorAgent.js — THE AI BRAIN                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. inferElementHint("//button[@id='loginn']")               ║
║     → XPath tag is "button"                                  ║
║     → { elementType: "button", action: "click" }            ║
║                                                              ║
║  2. trimDom(html)                                            ║
║     → cuts full page HTML down to 6000 chars                 ║
║     → focuses on <nav> or <header> area first                ║
║                                                              ║
║  3. buildPrompt(locator, trimmedDom)                         ║
║     → assembles strict prompt with:                          ║
║       - OUTPUT RULE (one selector only)                      ║
║       - ELEMENT TYPE CONTEXT (button, click)                 ║
║       - SELECTOR PRIORITY                                    ║
║         data-test > id > role > CSS > XPath                  ║
║       - FORBIDDEN list (dynamic classes, indexes, etc.)      ║
║       - SELF-CHECK instructions                              ║
║       - The broken locator                                   ║
║       - The DOM snapshot                                     ║
║                                                              ║
║  4. askAI(prompt)  ← calls aiClient                         ║
║     aiClient reads AI_PROVIDER env var                       ║
║     → local: routes to ollamaClient (localhost:11434)        ║
║     → CI:    routes to Groq API (api.groq.com)               ║
║                                                              ║
║  5. sanitise(rawResponse)                                    ║
║     → stripMarkdown   removes ``` fences, backticks          ║
║     → fixAttributeSelector                                   ║
║          data-test="x"  →  [data-test="x"]                   ║
║     → balanceBrackets   closes unclosed [ or "               ║
║     → returns: [data-test="login-button"]                    ║
╚══════════════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════╗
║  aiClient.js — THE PROVIDER ROUTER                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Reads: process.env.AI_PROVIDER                              ║
║                                                              ║
║  AI_PROVIDER=ollama (default, local)                         ║
║  → POST http://localhost:11434/api/generate                  ║
║    model: llama3, stream: false, temperature: 0.1            ║
║    Response: { "response": "[data-test=\"login-button\"]" }  ║
║                                                              ║
║  AI_PROVIDER=groq (CI/CD)                                    ║
║  → POST https://api.groq.com/openai/v1/chat/completions      ║
║    model: llama3-70b-8192, Authorization: Bearer GROQ_KEY    ║
║    Response: { choices[0].message.content: "..." }           ║
║                                                              ║
║  Both return: '[data-test="login-button"]'                   ║
╚══════════════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════╗
║  reportAgent.js — THE REPORTER                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Input: logs array (4 events collected during the heal)      ║
║                                                              ║
║  Reads events:                                               ║
║    original_failed → originalLocator = "//button[@id='loginn']"
║    ai_suggestion   → aiLocator = "[data-test='login-button']"║
║    validation      → validation = "passed"                   ║
║    outcome         → finalStatus = "healed"                  ║
║                                                              ║
║  Prints console summary:                                     ║
║  ════════════════════════════════════════                    ║
║    TEST REPORT                                               ║
║    Scenario     : S1: Wrong XPath id                         ║
║    Final Status : ✅ HEALED                                   ║
║  ════════════════════════════════════════                    ║
║                                                              ║
║  Appends to reports/test-report.json                         ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 5. The 3 Recovery Paths

```
Original locator FAILS
         │
         ▼
    AI suggests fix
         │
    ┌────┴──────────────────────────────────────┐
    │                                           │
count ≥ 1                                  count = 0
(AI locator found on page)           (AI locator not on page)
    │                                           │
    ▼                                           ▼
Try action                           DOM Heuristic Fallback
    │                                (scan page for keywords
    │                                 from broken locator)
    ├── ✅ works                           │
    │   status = "healed"            ┌─────┴──────┐
    │                             found        not found
    └── ❌ wrong type/hidden          │             │
         (e.g. fill on a button)   retry       throw ❌
              │                      │         status = "fallback"
              ▼                   ✅ healed
         2nd AI call
         with constraint
         ("don't return X again")
              │
         ┌────┴────┐
       works    fails
         │         │
      ✅ healed  throw ❌
                status = "failed"
```

---

## 6. Log Events — What gets recorded

Every event in the healing flow is logged as structured JSON.
These events are what `reportAgent.js` reads to build the report.

| Event name | When it fires | Key fields |
|---|---|---|
| `original_failed` | Original locator throws | `originalLocator`, `failureKind`, `errorMessage` |
| `ai_suggestion` | AI returns a locator | `originalLocator`, `aiLocator` |
| `ai_error` | AI call itself fails | `errorMessage` |
| `validation` | DOM count check runs | `validation: passed/failed`, `matchCount` |
| `heuristic_suggestion` | DOM heuristic finds something | `aiLocator` (heuristic result) |
| `wrong_type_retry` | AI locator is wrong element type | `retryReason` |
| `ai_suggestion_2` | Second AI call with constraint | `aiLocator` |
| `outcome` | Final result | `status: healed/failed/fallback` |

---

## 7. Selector Priority — What the AI is told to prefer

```
Priority    Selector type           Example
────────    ──────────────────────  ──────────────────────────────
1 (best)    data-test attribute     [data-test="login-button"]
2           data-testid attribute   [data-testid="submit-btn"]
3           Stable id               #login-button
4           ARIA role               role=button[name="Log in"]
5           Semantic CSS            form.login input[name="username"]
6 (last)    XPath                   //button[@type="submit"]
```

**Never allowed:**
- Dynamic class names: `css-1a2b3c`, `sc-bdVTJa`
- Positional indexes: `:nth-child(2)`, `[1]`
- Selector chains deeper than 3 levels
- Unclosed brackets or quotes

---

## 8. Test Results Summary

```
selfHealing.spec.js   (saucedemo.com — real site)
  8 scenarios, 8 passed — 100% heal rate ✅

stressHealing.spec.js (local fixture — edge cases)
  10 scenarios, 8 healed + 2 safe fallbacks ✅
  S8, S9 = intentional fallbacks (no stable selector exists)
           These prove the system fails SAFELY, not silently
```

---

## 9. Interview — How to explain this confidently

**"What did you build?"**
> An AI-powered self-healing layer for Playwright tests. When a locator fails,
> instead of the test crashing, the system automatically asks a local AI model
> to analyse the page DOM and suggest a corrected selector. It validates the
> suggestion before using it, retries the action, and generates a structured
> report — all without any human intervention.

**"What AI are you using?"**
> Two providers depending on environment. Locally we use Ollama running
> llama3 — free, offline, no data leaves the machine. In CI/CD (GitHub
> Actions) we use the Groq API with llama3-70b-8192 — same model family,
> free tier, very fast. The switch is a single environment variable:
> `AI_PROVIDER=ollama` or `AI_PROVIDER=groq`. No test files change.

**"How does the AI know what selector to return?"**
> Prompt engineering. We give it strict rules: return one selector only, prefer
> data-test attributes over IDs over CSS, never use dynamic class names or
> positional indexes. We also tell it what type of element we're looking for
> (button vs input) so it doesn't return a button when we need a text field.

**"What if the AI returns garbage?"**
> Two safety nets. First, a sanitiser in code strips markdown, fixes malformed
> attribute selectors, and closes unclosed brackets — regardless of what the
> model returns. Second, we validate with page.locator(aiLocator).count()
> before ever using it. If count is zero, we try a DOM heuristic fallback
> before giving up.

**"What's the heal rate?"**
> 100% on 8 real-world saucedemo scenarios. 8/10 on stress scenarios — the 2
> that fall back are intentional: they test that the system fails safely when
> no stable selector exists anywhere on the page.

**"Why not just use Cypress or fix the locators manually?"**
> Manual fixes don't scale. When a UI changes, dozens of locators can break at
> once. This system heals them automatically at runtime, logs exactly what broke
> and what fixed it, and produces a JSON report you can feed into dashboards or
> CI pipelines.

**"What is inferElementHint?"**
> A function that reads the broken locator string and guesses what type of
> element it was targeting — button, input, link, etc. This hint is injected
> into the AI prompt so the model doesn't return a button selector when the
> test needs to fill a text field.

**"What is the DOM heuristic fallback?"**
> A last-resort recovery that runs when the AI locator isn't found on the page.
> It extracts meaningful keywords from the broken locator (e.g. "login" from
> "#login-btn-xyz") and scans the page for elements whose data-test, id, or
> name contains that keyword. It only accepts an unambiguous match (count = 1)
> to avoid clicking the wrong element.

---

## 10. When to Add CrewAI / LangChain (Future)

You do NOT need them now. Add them when you hit these specific problems:

| Problem | What the framework adds |
|---|---|
| Tests fail across many pages and you want to learn patterns | Memory agent tracks which locators broke before |
| You want the AI to browse the live page itself | Tool-use agent opens the page and inspects it |
| You want a planner that decides the healing strategy | Orchestrator agent decides: try CSS first, then XPath, then screenshot OCR |
| You want natural language test generation from specs | Agent reads the test description and writes Playwright code |
| You want multi-model voting for higher confidence | 3 agents each suggest a locator, majority vote picks the winner |

**The honest rule:** add complexity only when your current system genuinely
cannot solve the problem — not before.

---

## 11. Quick Command Reference

```bash
# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Run only self-healing tests
npx playwright test tests/selfHealing.spec.js --headed

# Run only stress tests
npx playwright test tests/stressHealing.spec.js --headed

# Open HTML report
npm run report

# Test active AI provider (Ollama or Groq)
node scripts/testOllama.js

# Test with Groq explicitly
AI_PROVIDER=groq GROQ_API_KEY=gsk_... node scripts/testOllama.js

# Test locatorAgent manually
node scripts/testLocator.js

# Start Ollama (run in separate terminal)
ollama serve

# Check llama3 is available
ollama list
```

---

*Last updated: May 2026*
*Framework: Playwright + Ollama (local) + Groq (CI/CD) — no external AI frameworks*
