/**
 * selfHealing.spec.js
 *
 * Real-world stability test suite for the AI self-healing framework.
 * Every test intentionally uses a BROKEN locator to trigger self-healing.
 * The AI (Ollama / locatorAgent) must recover the correct selector.
 *
 * Target site : https://www.saucedemo.com
 * Credentials : standard_user / secret_sauce
 *
 * Scenarios
 * ─────────────────────────────────────────────────────────────────────────
 *  1. Wrong XPath id          – login button
 *  2. Wrong CSS id            – username field
 *  3. Wrong attribute name    – password field
 *  4. Typo in class name      – login button via class
 *  5. Wrong name attribute    – username input
 *  6. Completely wrong tag    – login button
 *  7. Wrong data-* attribute  – login button
 *  8. Partial / truncated CSS – login container form
 * ─────────────────────────────────────────────────────────────────────────
 */

const { test, expect } = require('@playwright/test');
const { selfHeal }     = require('../utils/selfHeal');
const { clearReport }  = require('../ai-service/reportAgent');

const BASE_URL  = 'https://www.saucedemo.com';
const USERNAME  = 'standard_user';
const PASSWORD  = 'secret_sauce';

// ── Shared setup ────────────────────────────────────────────────────────────

test.beforeAll(() => {
  // Start each run with a fresh report file
  clearReport();
  console.log('📂 Report file cleared for new run\n');
});

/**
 * Navigate to saucedemo and fill in credentials.
 * Returns the page ready for a login-button interaction.
 */
async function goToLogin(page) {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Swag Labs/);
  await page.locator('#user-name').fill(USERNAME);
  await page.locator('#password').fill(PASSWORD);
}

// ── Scenarios ───────────────────────────────────────────────────────────────

test.describe('AI Self-Healing — Real-World Failure Scenarios', () => {

  // 1. Wrong XPath id (loginn vs login-button)
  test('Scenario 1 — Wrong XPath id on login button', async ({ page }) => {
    await goToLogin(page);

    await selfHeal(
      page,
      "//button[@id='loginn']",
      async (loc) => page.locator(loc).click(),
      'S1: Wrong XPath id'
    );

    await expect(page).toHaveURL(/inventory/);
  });

  // 2. Wrong CSS id on username field (fill action)
  test('Scenario 2 — Wrong CSS id on username field', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Swag Labs/);

    // Heal the username fill first
    await selfHeal(
      page,
      '#usr-name',                          // ❌ wrong — correct is #user-name
      async (loc) => page.locator(loc).fill(USERNAME),
      'S2: Wrong CSS id on username'
    );

    // Fill password with correct locator, then login
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#login-button').click();
    await expect(page).toHaveURL(/inventory/);
  });

  // 3. Wrong attribute name on password field
  test('Scenario 3 — Wrong attribute name on password field', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Swag Labs/);

    await page.locator('#user-name').fill(USERNAME);

    await selfHeal(
      page,
      '[name="passwd"]',                    // ❌ wrong — correct is [name="password"]
      async (loc) => page.locator(loc).fill(PASSWORD),
      'S3: Wrong attribute name on password'
    );

    await page.locator('#login-button').click();
    await expect(page).toHaveURL(/inventory/);
  });

  // 4. Typo in class name on login button
  test('Scenario 4 — Typo in class name on login button', async ({ page }) => {
    await goToLogin(page);

    await selfHeal(
      page,
      '.btn_acton',                         // ❌ wrong — correct is .btn_action
      async (loc) => page.locator(loc).click(),
      'S4: Typo in class name'
    );

    await expect(page).toHaveURL(/inventory/);
  });

  // 5. Wrong name attribute on username input
  test('Scenario 5 — Wrong name attribute on username input', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Swag Labs/);

    await selfHeal(
      page,
      'input[name="uname"]',                // ❌ wrong — correct is input[name="user-name"]
      async (loc) => page.locator(loc).fill(USERNAME),
      'S5: Wrong name attribute on username'
    );

    await page.locator('#password').fill(PASSWORD);
    await page.locator('#login-button').click();
    await expect(page).toHaveURL(/inventory/);
  });

  // 6. Completely wrong tag for login button
  test('Scenario 6 — Wrong tag for login button', async ({ page }) => {
    await goToLogin(page);

    await selfHeal(
      page,
      'input#login-button',                 // ❌ wrong tag — it's a <input type="submit">, but id is correct
      async (loc) => page.locator(loc).click(),
      'S6: Wrong tag for login button'
    );

    await expect(page).toHaveURL(/inventory/);
  });

  // 7. Wrong data-* attribute value on login button
  test('Scenario 7 — Wrong data-test attribute value', async ({ page }) => {
    await goToLogin(page);

    await selfHeal(
      page,
      '[data-test="login-btn"]',            // ❌ wrong value — correct is data-test="login-button"
      async (loc) => page.locator(loc).click(),
      'S7: Wrong data-test value'
    );

    await expect(page).toHaveURL(/inventory/);
  });

  // 8. Partial / truncated CSS selector for login form
  test('Scenario 8 — Partial CSS selector for login form submit', async ({ page }) => {
    await goToLogin(page);

    await selfHeal(
      page,
      'form .login',                        // ❌ incomplete — no element matches this
      async (loc) => page.locator(loc).click(),
      'S8: Partial CSS selector'
    );

    await expect(page).toHaveURL(/inventory/);
  });

});
