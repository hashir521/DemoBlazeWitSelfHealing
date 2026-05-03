// @ts-check
const { test } = require('@playwright/test');
const { NavbarPage }  = require('./pages/NavbarPage');
const { SignupPage }  = require('./pages/SignupPage');
const { HomePage }    = require('./pages/HomePage');
const { selfHeal }    = require('../utils/selfHeal');

test('Signup with random credentials and scroll', async ({ page }) => {

  // Generate random username and password for this run
  const username = `user_${Math.random().toString(36).substring(2, 8)}`;
  const password = `pass_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[Signup] Username: ${username} | Password: ${password}`);

  const navbar = new NavbarPage(page);
  const signup = new SignupPage(page);
  const home   = new HomePage(page);

  // ─── Step 1: Go to URL and wait 2 seconds ─────────────────────────────────
  await page.goto('https://www.demoblaze.com/');
  // Animate browser into maximized mode after opening
  await page.evaluate(() => {
    window.moveTo(0, 0);
    window.resizeTo(screen.availWidth, screen.availHeight);
  });
  await page.waitForTimeout(600);
  await page.waitForTimeout(2000);

  // ─── Step 2: Click Sign up button from the navbar (self-healing) ──────────
  // NOTE: signupLink locator is intentionally broken (#signin2-BROKEN) to
  //       exercise the AI self-healing pipeline. selfHeal will detect the
  //       failure, ask the AI for the correct selector, and retry.
  await selfHeal(
    page,
    '#signin2-BROKEN',                        // ❌ broken locator
    async (loc) => {
      await page.locator(loc).click();
      await navbar.waitFor(1000);             // mirror NavbarPage.clickSignup() delay
    },
    'Signup scroll — signup link'
  );

  // ─── Step 3: Signup modal opens — fill random username and password ────────
  await signup.signup(username, password);

  // ─── Step 4: Browser popup opens — handled inside signup.signup() via registerDialogHandler()

  // ─── Step 5: Wait 3 seconds ───────────────────────────────────────────────
  await page.waitForTimeout(3000);

  // ─── Step 6: Scroll down ──────────────────────────────────────────────────
  await home.scrollDown(800);
  await page.waitForTimeout(800);
  await home.scrollDown(800);
  await page.waitForTimeout(800);

  // ─── Step 7: Scroll back up ───────────────────────────────────────────────
  await home.scrollToTop();
  await page.waitForTimeout(1000);

  console.log('[Done] ✅ Signup and scroll completed');
});
