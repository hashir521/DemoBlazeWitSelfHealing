// @ts-check
const { test, expect } = require('@playwright/test');
const { NavbarPage }   = require('./pages/NavbarPage');
const { SignupPage }   = require('./pages/SignupPage');
const { LoginPage }    = require('./pages/LoginPage');
const { HomePage }     = require('./pages/HomePage');
const { ProductPage }  = require('./pages/ProductPage');
const { CartPage }     = require('./pages/CartPage');
const { OrderPage }    = require('./pages/OrderPage');

// ─── Test Data ────────────────────────────────────────────────────────────────
// Username is generated fresh on every run → signup always succeeds
const USERNAME  = `user_${Math.random().toString(36).substring(2, 8)}`;
const PASSWORD  = 'admin';
const CATEGORY  = 'Monitors';
const PRODUCT   = 'Apple monitor 24';
const BASE_URL  = 'https://www.demoblaze.com/';

const ORDER_DETAILS = {
  name    : 'Hashir',
  country : 'Pakistan',
  city    : 'Karachi',
  card    : '4242424242',
  month   : 'April',
  year    : '2026',
};

test('DemoBlaze - Full E2E: Signup → Login → Browse → Cart → Purchase', async ({ page }) => {

  // Instantiate all page objects
  const navbar  = new NavbarPage(page);
  const signup  = new SignupPage(page);
  const login   = new LoginPage(page);
  const home    = new HomePage(page);
  const product = new ProductPage(page);
  const cart    = new CartPage(page);
  const order   = new OrderPage(page);

  // ─── Step 1: Open the website and wait 2 seconds ──────────────────────────
  await page.goto(BASE_URL);
  // Animate browser into maximized mode after opening
  await page.evaluate(() => {
    window.moveTo(0, 0);
    window.resizeTo(screen.availWidth, screen.availHeight);
  });
  await page.waitForTimeout(600);
  await page.waitForTimeout(2000);

  // ─── Step 2: Click Sign up from navbar and wait 1 second ──────────────────
  await navbar.clickSignup();

  // ─── Step 3-6: Signup popup — fill form, submit, handle alert ─────────────
  await signup.signup(USERNAME, PASSWORD);

  // ─── Step 7: Click Login from navbar and wait 1 second ────────────────────
  await navbar.clickLogin();

  // ─── Step 8-9: Login popup — fill form and submit ─────────────────────────
  await login.login(USERNAME, PASSWORD);

  // ─── Step 10: Verify navbar shows logged-in username ──────────────────────
  await expect(navbar.welcomeUser).toContainText(USERNAME);
  console.log(`[Auth] Logged in as: ${USERNAME}`);

  // ─── Step 11: Click Home from navbar and wait 1 second ────────────────────
  await navbar.clickHome();

  // ─── Step 12: Scroll down (two steps) then scroll back to top ─────────────
  await home.scrollDownAndUp();

  // ─── Step 13: Click "Monitors" category from left sidebar ─────────────────
  await home.clickCategory(CATEGORY);

  // ─── Step 14: Click on the product card ───────────────────────────────────
  await home.clickProduct(PRODUCT);

  // ─── Step 15: Verify product page heading ─────────────────────────────────
  await expect(product.productName).toContainText(PRODUCT);

  // ─── Step 16: Note the product price ──────────────────────────────────────
  const price = await product.getProductPrice();
  console.log(`[Product] "${PRODUCT}" — Price: $${price}`);

  // ─── Step 17: Click "Add to cart" and accept the alert popup ──────────────
  // First clear any leftover items from previous runs
  await navbar.clickCart();
  await cart.clearCart();
  // Navigate back to the product
  await navbar.clickHome();
  await home.clickCategory(CATEGORY);
  await home.clickProduct(PRODUCT);
  await product.clickAddToCart();

  // ─── Step 18: Click "Cart" from navbar and wait 3 seconds ─────────────────
  await navbar.clickCart();

  // ─── Step 19: Wait for cart table to load ─────────────────────────────────
  await cart.waitForCartToLoad();

  // ─── Step 20-23: Read total, verify > 0, verify matches product price ──────
  const total = await cart.getTotalPrice();
  console.log(`[Cart] Total price: $${total}`);
  expect(Number(total)).toBeGreaterThan(0);
  expect(total).toBe(price);
  console.log(`[Cart] ✅ Total price $${total} matches product price $${price}`);

  // ─── Step 24: Click the green "Place Order" button ────────────────────────
  await cart.clickPlaceOrder();

  // ─── Step 25: Place Order modal opens — fill all fields ───────────────────
  await order.waitForOrderModal();
  await order.fillOrderForm(ORDER_DETAILS);

  // ─── Step 26: Click "Purchase" button on the modal ────────────────────────
  await order.clickPurchase();

  // ─── Step 27: Purchase confirmation modal opens ───────────────────────────
  await order.waitForConfirmModal();

  // ─── Step 28: Capture screenshot of the confirmation modal ────────────────
  await order.captureConfirmationScreenshot('order-confirmation');

  // ─── Step 29: Extract and log all values from the confirmation modal ───────
  const confirmation = await order.getConfirmationDetails();

  // Verify key fields are not empty
  expect(confirmation.id).not.toBe('N/A');
  expect(confirmation.amount).toContain(price);
  expect(confirmation.name).toBe(ORDER_DETAILS.name);

  // ─── Step 30: Click "OK" to close the confirmation modal ──────────────────
  await order.clickOk();

  console.log(`[Done] ✅ Order completed successfully! Order ID: ${confirmation.id}`);
});
