# AI Self-Healing Playwright Framework
## Complete Integration Guide — From Zero to Production

> Use this file for any new or existing Playwright project.
> Copy the prompts, follow the steps, and you will have a fully working
> AI self-healing test framework identical to what we built.

---

## TABLE OF CONTENTS

1. [What You Will Have After This Guide](#1-what-you-will-have-after-this-guide)
2. [Prerequisites — Install Everything](#2-prerequisites--install-everything)
3. [Folder Structure — Copy This Exactly](#3-folder-structure--copy-this-exactly)
4. [Step-by-Step Setup Guide](#4-step-by-step-setup-guide)
5. [All Prompts — Copy and Use in Kiro/AI Chat](#5-all-prompts--copy-and-use-in-kiroai-chat)
6. [How to Integrate Into an Existing Project](#6-how-to-integrate-into-an-existing-project)
7. [How to Use selfHeal in Your Tests](#7-how-to-use-selfheal-in-your-tests)
8. [Verify Everything Works](#8-verify-everything-works)
9. [Troubleshooting](#9-troubleshooting)
10. [Interview Answers](#10-interview-answers)

---

## 1. What You Will Have After This Guide

```
✅ Playwright test framework (JavaScript)
✅ Page Object Model (POM) structure
✅ Local AI model (Ollama + llama3) running on your machine
✅ Groq cloud AI for CI/CD (free tier, no credit card)
✅ AI-powered self-healing when locators break
✅ Validation layer (checks AI suggestion before using it)
✅ DOM heuristic fallback (backup when AI fails)
✅ Structured JSON logging for every healing event
✅ Auto-generated test reports saved to reports/test-report.json
✅ GitHub Actions CI/CD pipeline included
✅ Works 100% offline locally — switches to Groq automatically in CI
```

---

## 2. Prerequisites — Install Everything

### Step 1 — Install Node.js
```
Download from: https://nodejs.org
Choose: LTS version (18 or higher)
Verify: node --version   should show v18+
        npm --version    should show 9+
```

### Step 2 — Install Ollama (the local AI engine)
```
Download from: https://ollama.com/download
Choose your OS: macOS / Windows / Linux

macOS:    Download the .dmg and drag to Applications
Windows:  Download the .exe installer and run it
Linux:    curl -fsSL https://ollama.com/install.sh | sh
```

Verify Ollama installed:
```bash
ollama --version
```

### Step 3 — Download the llama3 AI model
```bash
# This downloads the model (about 4.7 GB — do this once)
ollama pull llama3
```

Verify the model is available:
```bash
ollama list
# Should show: llama3   latest   ...
```

### Step 4 — Start Ollama (keep this running in background)
```bash
ollama serve
# You will see: Listening on 127.0.0.1:11434
```

> IMPORTANT: Ollama must be running whenever you run tests.
> Open a separate terminal and leave it running.

### Step 5 — Install Playwright
```bash
# In your project folder
npm init -y
npm install --save-dev @playwright/test
npx playwright install chromium
```

---

## 3. Folder Structure — Copy This Exactly

```
your-project/
│
├── ai-service/
│   ├── ollamaClient.js          ← HTTP client for Ollama (local only)
│   ├── aiClient.js              ← Provider router: Ollama or Groq
│   ├── locatorAgent.js          ← AI brain — fixes broken locators
│   └── reportAgent.js           ← Generates reports from logs
│
├── utils/
│   └── selfHeal.js              ← Main orchestrator — use this in tests
│
├── tests/
│   ├── pages/                   ← Page Object Model classes
│   │   ├── BasePage.js          ← Base class all pages extend
│   │   └── [YourPage].js        ← One file per page of your app
│   ├── fixtures/
│   │   └── stress-page.html     ← (optional) local HTML for testing
│   └── [yourTest].spec.js       ← Your actual test files
│
├── scripts/
│   ├── testOllama.js            ← Manual: test active AI provider
│   └── testLocator.js           ← Manual: test locatorAgent
│
├── .github/
│   └── workflows/
│       └── playwright.yml       ← GitHub Actions CI/CD pipeline
│
├── reports/                     ← Auto-created, stores test-report.json
├── playwright.config.js
├── package.json
├── .env.example                 ← Documents env vars (safe to commit)
└── .gitignore
```

---

## 4. Step-by-Step Setup Guide

### Step 1 — Create project and install dependencies
```bash
mkdir my-project
cd my-project
npm init -y
npm install --save-dev @playwright/test
npx playwright install chromium
```

Add to `package.json` scripts section:
```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report"
  },
  "type": "commonjs"
}
```

### Step 2 — Create folder structure
```bash
mkdir ai-service utils tests/pages tests/fixtures scripts reports
```

### Step 3 — Create playwright.config.js
```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 90000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://YOUR-APP-URL.com',   // ← change this
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    headless: !!process.env.CI,  // headed locally, headless in CI
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Step 4 — Create .gitignore
```
node_modules/
playwright-report/
test-results/
reports/
screenshots/
.DS_Store
.env
```

### Step 5 — Create .env.example
```
AI_PROVIDER=ollama
GROQ_API_KEY=your_groq_api_key_here
```

### Step 6 — Copy all AI service files
Use the prompts in Section 5 to generate each file, or copy from the
reference project. Files needed:
- `ai-service/ollamaClient.js`
- `ai-service/aiClient.js`
- `ai-service/locatorAgent.js`
- `ai-service/reportAgent.js`
- `utils/selfHeal.js`

### Step 7 — Verify Ollama is working
```bash
node scripts/testOllama.js
# Should print 3 AI responses
```

### Step 8 — Write your first self-healing test
See Section 7 for how to use `selfHeal` in your tests.

---

## 5. All Prompts — Copy and Use in Kiro/AI Chat

---

### PROMPT 1 — Create ollamaClient.js

```
Create a Node.js module called ollamaClient.js.

Requirements:
- Call local Ollama API at http://localhost:11434/api/generate
- Use model: llama3
- Accept a prompt string and optional options object
- Return only the AI response text
- Use native fetch (Node 18+)
- Clear error message if Ollama is not running
- Export: { askOllama }
- Place in: ai-service/ollamaClient.js

Note: This file handles Ollama only.
      Provider routing (Ollama vs Groq) lives in aiClient.js.
```

---

### PROMPT 1b — Create aiClient.js (provider router)

```
Create a Node.js module called aiClient.js for a Playwright AI framework.

Requirements:
- Import askOllama from ./ollamaClient
- Export: { askAI }

askAI(prompt, options) must:
- Read process.env.AI_PROVIDER (default: "ollama")
- If AI_PROVIDER=ollama → call askOllama (local Ollama)
- If AI_PROVIDER=groq   → call Groq API

Groq API integration:
- Endpoint: https://api.groq.com/openai/v1/chat/completions
- Model: llama3-70b-8192
- Headers: Authorization: Bearer process.env.GROQ_API_KEY
- Body: { model, messages: [{ role: "user", content: prompt }],
          temperature: 0.1, max_tokens: 300, stream: false }
- Return: choices[0].message.content (trimmed)
- Throw clear error if GROQ_API_KEY is not set
- Throw clear error if API returns non-200

Log which provider is being used:
- Ollama: console.log('🖥️  AI Provider: Ollama (local)')
- Groq:   console.log('🌐 AI Provider: Groq (cloud)')

Place in: ai-service/aiClient.js
```

---

### PROMPT 2 — Create locatorAgent.js

```
Create a Node.js module called locatorAgent.js for a Playwright AI
automation framework.

Requirements:
- Import askAI from ./aiClient  (NOT askOllama from ollamaClient)
- Input: failed locator string + page DOM HTML
- Output: ONLY a valid XPath or CSS selector — no explanations, no extra text

Prompt engineering rules:
- Use a strict prompt that forces clean output
- Prefer selectors in this priority order:
  1. [data-test="value"] or [data-testid="value"]  ← most preferred
  2. #stableId  (skip if id looks auto-generated)
  3. role=button[name="Label"]  (Playwright ARIA)
  4. Clean CSS: form.login input[name="username"]
  5. XPath: //button[@type="submit"]  ← last resort only
- NEVER return: dynamic classes, positional indexes, unclosed brackets
- Include a SELF-CHECK step in the prompt
- Include inferElementHint() function that reads the broken locator
  and returns { elementType, action } to steer the AI toward the
  correct element type (button vs input vs link)
- Include sanitise() pipeline:
  - stripMarkdown (remove ``` fences, backticks)
  - fixAttributeSelector (fix data-test="x" → [data-test="x"])
  - balanceBracketsAndQuotes (close unclosed [ or ")
- Include trimDom() to limit DOM to 6000 chars
- Call: askAI(prompt, { temperature: 0.1 })
- Export: { fixLocator }
- Place in: ai-service/locatorAgent.js
```

---

### PROMPT 3 — Create selfHeal.js

```
Create a utility called selfHeal.js for a Playwright AI self-healing framework.

Requirements:
- Import fixLocator from ../ai-service/locatorAgent
- Import generateReport from ../ai-service/reportAgent
- Export: async function selfHeal(page, locator, actionFn, testName)

The function must implement this exact 5-step flow:

STEP 1: Try original locator
  - Call actionFn(locator)
  - If it works, return immediately (nothing to heal)
  - If it fails, capture the error and classify it:
    timeout / not-visible / not-attached / wrong-type / ambiguous / error

STEP 2: Ask AI for a replacement
  - Get page.content() for the DOM
  - Call fixLocator(locator, dom)
  - Log the AI suggestion

STEP 3: Validate AI locator
  - Call page.locator(aiLocator).count()
  - If count = 0: try DOM heuristic fallback (see below)
  - If count >= 1: proceed to Step 4

DOM Heuristic Fallback (when AI locator not found):
  - Extract keywords (4+ chars) from the broken locator
  - For each keyword, try these selectors in order:
    [data-testid*="keyword"], [data-test*="keyword"],
    [id*="keyword"], [name*="keyword"]
  - Only accept count = 1 (unambiguous match)
  - If found: use it and mark as healed
  - If not found: throw original error (status: fallback)

STEP 4: Retry with validated AI locator
  - Call actionFn(aiLocator)
  - If it fails with wrong-type/hidden error:
    - Make a second AI call with constraint message
    - "Do NOT return [aiLocator] — it failed because [reason]"
    - Validate and retry with second suggestion
  - If still fails: throw original error

STEP 5: Generate report
  - Call generateReport(logs, testName)

Logging requirements:
  - Every event must be logged BOTH as:
    a) Human-readable console line with emoji
    b) Structured JSON: { timestamp, message, event, ...fields }
  - Collect all logs in an array during the heal attempt
  - Pass the array to generateReport at the end

Log events to emit:
  original_failed, ai_suggestion, ai_error, validation,
  heuristic_suggestion, wrong_type_retry, ai_suggestion_2, outcome

Place in: utils/selfHeal.js
```

---

### PROMPT 4 — Create reportAgent.js

```
Create a reporting module called reportAgent.js for a Playwright AI
self-healing framework.

Requirements:
- Import fs and path (Node.js built-ins)
- Save reports to: reports/test-report.json
- Export: { generateReport, clearReport }

generateReport(logs, testName) must:
1. Read these events from the logs array:
   - original_failed → originalLocator, errorMessage
   - ai_suggestion   → aiLocator
   - validation      → validation (passed/failed)
   - outcome         → finalStatus (healed/failed/fallback)

2. Print a human-readable console summary:
   ════════════════════════════════════════
     TEST REPORT
     Scenario         : [testName]
     Original Locator : [broken locator]
     AI Locator Used  : [fixed locator]
     Validation       : PASSED / FAILED
     Final Status     : ✅ HEALED / ❌ FAILED
   ════════════════════════════════════════

3. Print structured JSON to console

4. APPEND (not overwrite) one entry to reports/test-report.json
   The file holds a JSON array — one entry per selfHeal call
   Create the reports/ directory if it doesn't exist

clearReport() must:
- Reset reports/test-report.json to an empty array []
- Call this in beforeAll() at the start of each test run

Place in: ai-service/reportAgent.js
```

---

### PROMPT 5 — Create BasePage.js (POM base class)

```
Create a BasePage.js for a Playwright Page Object Model framework.

Requirements:
- Class: BasePage
- Constructor accepts: page (Playwright page object)
- Include these shared helper methods:
  - async navigate(url)
  - async click(locator)
  - async fill(locator, value)
  - async getText(locator)
  - async isVisible(locator)
  - async waitForElement(locator, timeout = 5000)
  - async scrollDown()
  - async scrollToTop()
  - async handleDialog()  ← registers page.once('dialog') and clicks OK
  - async takeScreenshot(name)  ← saves to screenshots/ folder
- All methods should use this.page
- Export the class
- Place in: tests/pages/BasePage.js
```

---

### PROMPT 6 — Create a Page Object for your specific page

```
Create a [PageName]Page.js for a Playwright Page Object Model.

Target URL: [YOUR PAGE URL]
Page purpose: [WHAT THIS PAGE DOES]

Requirements:
- Import and extend BasePage from ./BasePage
- Class name: [PageName]Page
- Constructor: super(page)
- Include locators as class properties (use data-test attributes if available)
- Include these methods:
  [LIST YOUR PAGE ACTIONS HERE]
  Example:
  - async login(username, password)
  - async clickLoginButton()
  - async getErrorMessage()
- Export the class
- Place in: tests/pages/[PageName]Page.js
```

---

### PROMPT 7 — Create a self-healing test spec

```
Create a Playwright test file that demonstrates AI self-healing.

File: tests/[yourTest].spec.js
Target URL: [YOUR URL]

Requirements:
- Import { test, expect } from @playwright/test
- Import { selfHeal } from ../utils/selfHeal
- Import { clearReport } from ../ai-service/reportAgent
- Call clearReport() in beforeAll()

Include these test scenarios (each uses a BROKEN locator intentionally):
1. Wrong XPath id on [element name]
   Broken: [your broken locator]
   Action: click / fill

2. Wrong CSS id on [element name]
   Broken: [your broken locator]
   Action: click / fill

3. Wrong attribute value on [element name]
   Broken: [your broken locator]
   Action: click / fill

[Add more scenarios as needed]

For each test:
- Navigate to the page
- Use selfHeal(page, brokenLocator, async (loc) => { action }, 'scenario name')
- Assert the expected result after healing
- Add a comment showing the correct locator

Place in: tests/[yourTest].spec.js
```

---

### PROMPT 8 — Create test scripts for manual verification

```
Create two manual test scripts:

1. scripts/testOllama.js
   - Import askAI from ../ai-service/aiClient
   - Run 3 test prompts:
     a) Basic question to verify AI responds
     b) A selector fix prompt similar to what locatorAgent sends
     c) A prompt with custom temperature option
   - Print which provider is active at the top
   - Print results clearly with labels
   - Wrap in try/catch with clear error messages
   - Works for both Ollama and Groq based on AI_PROVIDER env var

2. scripts/testLocator.js
   - Import fixLocator from ../ai-service/locatorAgent
   - Test with a broken XPath: //button[@id='loginn']
   - Use a simple HTML snippet as the DOM
   - Print the fixed locator
   - Wrap in try/catch

Both files: use async IIFE pattern — (async () => { ... })()
```

---

### PROMPT 9 — Add self-healing to an EXISTING test

```
I have an existing Playwright test file at: [path to your test file]

I want to add AI self-healing to it without rewriting the whole test.

Requirements:
- Add import { selfHeal } from '../utils/selfHeal' at the top
- Add import { clearReport } from '../ai-service/reportAgent' at the top
- Add clearReport() call in beforeAll() (create one if it doesn't exist)
- Find the locator most likely to break: [describe which action/locator]
- Wrap that specific action in selfHeal():

  BEFORE:
  await page.locator('[broken-locator]').click();

  AFTER:
  await selfHeal(
    page,
    '[broken-locator]',
    async (loc) => page.locator(loc).click(),
    'Descriptive test name'
  );

- Keep all other locators unchanged
- Do not change the test logic or assertions
```

---

### PROMPT 10 — Full project scaffold from scratch

```
Scaffold a complete Playwright AI self-healing test project from scratch.

Project details:
- Project name: [your project name]
- Target application URL: [your URL]
- Pages to test: [list your pages, e.g. Login, Dashboard, Checkout]
- Key user flows: [describe 2-3 main flows]

Create ALL of these files:
1. package.json (with correct scripts and type: commonjs)
2. playwright.config.js (configured for the URL above)
3. .gitignore
4. ai-service/ollamaClient.js
5. ai-service/locatorAgent.js
6. ai-service/reportAgent.js
7. utils/selfHeal.js
8. tests/pages/BasePage.js
9. tests/pages/[Page1]Page.js  ← for each page listed above
10. tests/[mainFlow].spec.js   ← with self-healing integrated
11. scripts/testOllama.js
12. scripts/testLocator.js

Follow these standards:
- CommonJS modules (require/module.exports)
- All AI files in ai-service/
- All page objects extend BasePage
- selfHeal used for any locator that could break
- clearReport() called in beforeAll()
- Structured JSON logging in selfHeal
- Reports saved to reports/test-report.json
```

---

## 6. How to Integrate Into an Existing Project

If you already have a Playwright project and just want to add self-healing:

### Step 1 — Copy the AI service files into your project
```
Copy these 5 files into your project:
  ai-service/ollamaClient.js
  ai-service/aiClient.js
  ai-service/locatorAgent.js
  ai-service/reportAgent.js
  utils/selfHeal.js
```

### Step 2 — Create the reports folder
```bash
mkdir reports
```

### Step 3 — Add to .gitignore
```
reports/
```

### Step 4 — Update your test files
Add these imports at the top of any test file:
```javascript
const { selfHeal }    = require('../utils/selfHeal');
const { clearReport } = require('../ai-service/reportAgent');
```

Add this before your tests:
```javascript
test.beforeAll(() => {
  clearReport();
});
```

### Step 5 — Wrap risky locators with selfHeal
```javascript
// BEFORE (will crash if locator breaks)
await page.locator('#submit-btn').click();

// AFTER (will self-heal if locator breaks)
await selfHeal(
  page,
  '#submit-btn',
  async (loc) => page.locator(loc).click(),
  'Submit button click'
);
```

---

## 7. How to Use selfHeal in Your Tests

### Basic usage — click
```javascript
await selfHeal(
  page,
  '#login-button',                        // locator (can be broken)
  async (loc) => page.locator(loc).click(), // action to perform
  'Login button click'                    // name for the report
);
```

### Basic usage — fill input
```javascript
await selfHeal(
  page,
  '#username',
  async (loc) => page.locator(loc).fill('myuser'),
  'Username field fill'
);
```

### With assertion after healing
```javascript
await selfHeal(
  page,
  '[data-test="checkout-btn"]',
  async (loc) => page.locator(loc).click(),
  'Checkout button'
);

// Assert after selfHeal — this runs regardless of which locator was used
await expect(page).toHaveURL(/checkout/);
```

### Multiple selfHeal calls in one test
```javascript
test('complete login flow', async ({ page }) => {
  await page.goto('https://your-app.com');

  // Each selfHeal is independent
  await selfHeal(page, '#usr-name',
    async (loc) => page.locator(loc).fill('admin'),
    'Username field');

  await selfHeal(page, '#pwd',
    async (loc) => page.locator(loc).fill('password'),
    'Password field');

  await selfHeal(page, '#login-btn',
    async (loc) => page.locator(loc).click(),
    'Login button');

  await expect(page).toHaveURL(/dashboard/);
});
```

### When NOT to use selfHeal
```javascript
// Don't wrap assertions — only wrap actions
await expect(page).toHaveTitle(/My App/);  // ← no selfHeal needed

// Don't wrap navigation — only wrap element interactions
await page.goto(URL);  // ← no selfHeal needed

// Don't wrap if the locator is already a data-test attribute
// and you're confident it won't change
await page.locator('[data-test="stable-element"]').click(); // ← fine as-is
```

---

## 8. Verify Everything Works

### Check 1 — Ollama is running
```bash
curl http://localhost:11434/api/generate \
  -d '{"model":"llama3","prompt":"say hello","stream":false}'
# Should return JSON with a "response" field
```

### Check 2 — AI client works (Ollama)
```bash
node scripts/testOllama.js
# Should print: 🖥️  AI Provider: Ollama (local)
# Then 3 AI responses

# Test Groq instead:
AI_PROVIDER=groq GROQ_API_KEY=gsk_... node scripts/testOllama.js
# Should print: 🌐 AI Provider: Groq (cloud)
```

### Check 3 — locatorAgent works
```bash
node scripts/testLocator.js
# Should print a fixed CSS or XPath selector
```

### Check 4 — Run the self-healing tests
```bash
npx playwright test tests/selfHealing.spec.js --headed
# Should show 8 tests passing with healing logs in console
```

### Check 5 — View the report
```bash
cat reports/test-report.json
# Should show a JSON array with one entry per test
```

---

## 9. Troubleshooting

### "Failed to reach Ollama at http://localhost:11434"
```
Cause:  Ollama is not running
Fix:    Open a terminal and run: ollama serve
        Keep that terminal open while running tests
```

### "ollama: command not found"
```
Cause:  Ollama is not installed
Fix:    Download from https://ollama.com/download and install
```

### "model 'llama3' not found"
```
Cause:  llama3 model was not downloaded
Fix:    Run: ollama pull llama3
        Wait for download to complete (about 4.7 GB)
```

### AI keeps returning the same broken locator
```
Cause:  The element has no stable attributes (no data-test, no id, no name)
Fix:    Add data-test attributes to your HTML elements
        OR accept that this element will use the DOM heuristic fallback
```

### "Timeout 10000ms exceeded" even after healing
```
Cause:  AI returned a valid selector but the element is still not clickable
        (could be hidden, covered by another element, or off-screen)
Fix:    Check if the element needs scrolling into view first
        Add: await page.locator(loc).scrollIntoViewIfNeeded()
        before the click in your actionFn
```

### Tests run but no report is generated
```
Cause:  clearReport() was not called, or reports/ folder doesn't exist
Fix:    Add clearReport() in beforeAll()
        Run: mkdir reports
```

### AI returns explanation text instead of a selector
```
Cause:  The model ignored the output rules (happens occasionally)
Fix:    The sanitise() pipeline in locatorAgent handles this automatically
        If it still fails, the DOM heuristic fallback will try to recover
```

---

## 10. Interview Answers

**Q: What is AI self-healing in test automation?**
> When a UI element changes (id renamed, class updated, structure shifted),
> traditional tests crash with a locator error. Self-healing means the test
> automatically detects the failure, asks an AI to find the correct element
> using the page's current HTML, validates the suggestion, and retries —
> all without human intervention.

**Q: What technology stack did you use?**
> Playwright for browser automation, Node.js for the runtime, Ollama running
> llama3 locally as the AI model. No cloud APIs, no external dependencies
> beyond what's in package.json.

**Q: Why Ollama instead of OpenAI?**
> Three reasons: cost (free), privacy (data never leaves the machine), and
> reliability (no API rate limits or outages). For a QA tool that runs in CI,
> you want zero external dependencies.

**Q: How does the AI know what selector to return?**
> Prompt engineering. The prompt tells the model: return exactly one selector,
> prefer data-test attributes, never use dynamic class names, and verify your
> answer before responding. We also inject the element type (button vs input)
> so it doesn't confuse them.

**Q: What happens if the AI returns a bad selector?**
> Three layers of protection:
> 1. A sanitiser in code fixes common mistakes (unclosed brackets, bare
>    attribute expressions, markdown formatting)
> 2. We validate with count() before using the selector — if it finds zero
>    elements, we don't use it
> 3. A DOM heuristic fallback scans the page for keyword matches as a
>    last resort

**Q: What is the Page Object Model?**
> A design pattern where each page of the application has its own class.
> The class contains the locators and actions for that page. Tests import
> the page class and call its methods instead of writing raw Playwright
> commands. This means if a locator changes, you fix it in one place.

**Q: How do you handle flaky tests?**
> Several ways: Playwright's built-in auto-waiting handles most timing issues.
> For locators that change between releases, selfHeal wraps the action so it
> recovers automatically. For elements that load asynchronously, we use
> waitFor with a state of 'visible' before interacting.

**Q: How would you scale this to a large test suite?**
> The selfHeal utility is a drop-in wrapper — you add it around any locator
> that's at risk of breaking. The report system appends one entry per heal
> attempt, so after a full suite run you have a JSON file showing exactly
> which locators broke and what the AI fixed them to. That data can feed
> a dashboard or alert system.

---

## Quick Reference Card

```
COMMAND                                          WHAT IT DOES
─────────────────────────────────────────────────────────────────────
ollama serve                                     Start Ollama locally
ollama pull llama3                               Download llama3 (once)
ollama list                                      See downloaded models
node scripts/testOllama.js                       Test Ollama connection
AI_PROVIDER=groq GROQ_API_KEY=gsk_... \
  node scripts/testOllama.js                     Test Groq connection
node scripts/testLocator.js                      Test locator fixing
npm test                                         Run all tests (headless)
npm run test:headed                              Run with browser visible
npx playwright test [file] --headed              Run one file with browser
npm run report                                   Open HTML test report
cat reports/test-report.json                     View healing report
```

---

## File Contents Checklist

When setting up a new project, confirm these files exist and are not empty:

```
□ ai-service/ollamaClient.js     exports: { askOllama }
□ ai-service/aiClient.js         exports: { askAI }
□ ai-service/locatorAgent.js     exports: { fixLocator }
□ ai-service/reportAgent.js      exports: { generateReport, clearReport }
□ utils/selfHeal.js              exports: { selfHeal }
□ tests/pages/BasePage.js        exports: BasePage class
□ playwright.config.js           has correct baseURL, headless: !!process.env.CI
□ package.json                   has "type": "commonjs" and test scripts
□ .env.example                   has AI_PROVIDER and GROQ_API_KEY documented
□ .gitignore                     includes node_modules/, reports/, .env
□ .github/workflows/playwright.yml  CI/CD pipeline exists
□ reports/                       folder exists (create with mkdir reports)
```

---

*Created: May 2026*
*Stack: Playwright (JavaScript) + Ollama (local) + Groq (CI/CD) + GitHub Actions*
*No external AI frameworks — pure prompt engineering*
