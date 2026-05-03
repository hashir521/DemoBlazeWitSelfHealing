// @ts-check
const { test, expect } = require('@playwright/test');
const { NavbarPage }   = require('./pages/NavbarPage');
const { SignupPage }   = require('./pages/SignupPage');
const { LoginPage }    = require('./pages/LoginPage');
const { HomePage }     = require('./pages/HomePage');
const { ProductPage }  = require('./pages/ProductPage');
const { CartPage }     = require('./pages/CartPage');

// ─── Test Data ────────────────────────────────────────────────────────────────
const USERNAME    = 'hashiradmin';
const PASSWORD    = 'admin';
const CATEGORY    = 'Monitors';
const PRODUCT     = 'Apple monitor 24';
const BASE_URL    = 'https://www.demoblaze.com/';

test('DemoBlaze - Signup, Login, Browse, Add to Cart and Verify Total', async ({ page }) => {

  // Instantiate all page objects
  const navbar  = new NavbarPage(page);
  const signup  = new SignupPage(page);
  const login   = new LoginPage(page);
  const home    = new HomePage(page);
  const product = new ProductPage(page);
  const cart    = new CartPage(page);

  // ─── Step 1: Open the website and wait 2 seconds ──────────────────────────
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  // ─── Step 2: Click Sign up from navbar ────────────────────────────────────
  await navbar.clickSignup();

  // ─── Step 3-7: Fill signup form and handle confirmation alert ─────────────
  // Note: if the user already exists the alert still fires and is accepted —
  // we just proceed to login regardless of whether signup succeeded.
  await signup.signup(USERNAME, PASSWORD);

  // ─── Step 8: Click Login from navbar ──────────────────────────────────────
  await navbar.clickLogin();

  // ─── Step 9-10: Fill login form and submit ────────────────────────────────
  await login.login(USERNAME, PASSWORD);

  // Verify login was successful
  await expect(navbar.welcomeUser).toContainText(USERNAME);
  console.log(`[Auth] Logged in as: ${USERNAME}`);

  // ─── Step 11: Click Home from navbar ──────────────────────────────────────
  await navbar.clickHome();

  // ─── Step 12: Scroll down then scroll back to top ─────────────────────────
  await home.scrollDownAndUp();

  // ─── Step 13: Click "Monitors" category from left sidebar ─────────────────
  await home.clickCategory(CATEGORY);

  // ─── Step 14: Click on the product card ───────────────────────────────────
  await home.clickProduct(PRODUCT);

  // ─── Step 15: Verify product page loaded ──────────────────────────────────
  await expect(product.productName).toContainText(PRODUCT);
  const price = await product.getProductPrice();
  console.log(`[Product] "${PRODUCT}" — Price: $${price}`);

  // ─── Step 16: Click "Add to cart" and accept the alert popup ──────────────
  await product.clickAddToCart();

  // ─── Step 17: Click "Cart" from navbar and wait 3 seconds ─────────────────
  await navbar.clickCart();

  // ─── Step 18: Wait for cart to load and verify total price ────────────────
  await cart.waitForCartToLoad();
  const total = await cart.getTotalPrice();
  console.log(`[Cart] Total price: $${total}`);

  // Verify total matches the product price
  expect(Number(total)).toBeGreaterThan(0);
  expect(total).toBe(price);
  console.log(`[Cart] ✅ Total price $${total} matches product price $${price}`);
});
