# Test Reference Guide
> Paste any prompt from this file directly into Kiro chat to run or modify a test.

---

## How Kiro Identifies Your Test

You can refer to a test in 3 ways:

| Method | Example |
|--------|---------|
| **File name** | `Target file: tests/demoblaze_admintest.spec.js` |
| **Test name** | `Run the test named "DemoBlaze - Full E2E: Signup → Login → Browse → Cart → Purchase"` |
| **Description** | `Run the full flow that signs up, logs in, adds Apple monitor to cart and places the order` |

> 💡 **Tip:** Always add `Target file: <path>` at the top of your prompt — it's the fastest and clearest way.

---

## All Test Files

| # | File | Test Name | What It Does |
|---|------|-----------|--------------|
| 1 | `tests/demoblaze_admintest.spec.js` | DemoBlaze - Full E2E: Signup → Login → Browse → Cart → Purchase | Complete flow: signup (random user) → login → browse → add to cart → place order → purchase → capture confirmation screenshot |
| 2 | `tests/signup_scroll.spec.js` | Signup with random credentials and scroll | Short flow: signup with random user → browser alert → scroll down → scroll up |
| 3 | `tests/demoblaze.spec.js` | DemoBlaze - Signup, Login and Browse | Original flow: signup → login → browse → add to cart → verify total (no purchase) |
| 4 | `tests/example.spec.js` | example test | Basic smoke test: open homepage and verify title |

---

## Page Objects (POM Structure)

| File | Class | Responsibility |
|------|-------|----------------|
| `tests/pages/BasePage.js` | `BasePage` | Shared helpers: click, fill, scroll, waitFor, generateUsername, dialog handler |
| `tests/pages/NavbarPage.js` | `NavbarPage` | Top navbar: signup, login, home, cart links |
| `tests/pages/SignupPage.js` | `SignupPage` | Sign Up modal: fill form, submit, close modal |
| `tests/pages/LoginPage.js` | `LoginPage` | Log In modal: fill form, submit |
| `tests/pages/HomePage.js` | `HomePage` | Product listing: categories, product cards, scroll |
| `tests/pages/ProductPage.js` | `ProductPage` | Product detail: name, price, add to cart |
| `tests/pages/CartPage.js` | `CartPage` | Cart: total price, clear cart, place order |
| `tests/pages/OrderPage.js` | `OrderPage` | Place Order modal + Purchase confirmation modal + screenshot |

---

## Ready-to-Use Prompts

Copy any block below and paste it directly into Kiro chat.

---

### I▶ Run Full E2E Test (Signup → Purchase)
```
Target file: tests/demoblaze_admintest.spec.js

Run this test as-is. No changes needed.
```

---

### ▶ Run Short Signup + Scroll Test
```
Target file: tests/signup_scroll.spec.js

Run this test as-is. No changes needed.
```

---

### ▶ Run Original Flow (No Purchase)
```
Target file: tests/demoblaze.spec.js

Run this test as-is. No changes needed.
```

---

### ▶ Run All Tests
```
Run all tests in the project using: npm test
```

---

### ▶ Create a New Test (Full Template)
```
I need a Playwright (JavaScript) test using the Page Object Model (POM) structure.

Target file: tests/<your-test-name>.spec.js
Reuse existing page objects from: tests/pages/

--- TEST DATA ---
URL:           <your-url>
Username:      random (generate fresh each run)
Password:      random (generate fresh each run)
Category:      <category-name>        (e.g. Monitors, Phones, Laptops)
Product Name:  <product-name>         (e.g. Apple monitor 24)

--- ORDER DETAILS (if purchase flow needed) ---
Name:          <full-name>
Country:       <country>
City:          <city>
Credit Card:   <card-number>
Month:         <month>
Year:          <year>

--- STEPS ---
1.  <step 1>
2.  <step 2>
3.  <step 3>
... (add as many steps as needed in plain English)

--- NOTES ---
- Reuse existing POM page objects, do not modify them
- Generate a random username each run so signup always succeeds
- Register page.once('dialog') BEFORE the action that triggers the alert
- Run in headed mode (browser visible)
- Add console.log() for key values (username, price, total, order ID)
- Save confirmation screenshot to /screenshots folder
```

---

### ▶ Add Steps to an Existing Test
```
Target file: tests/<existing-test-file>.spec.js

Add the following steps AFTER step <N> in the existing test.
Do NOT change any other steps or page objects.

New steps:
1. <new step 1>
2. <new step 2>
```

---

### ▶ Change Test Data Only
```
Target file: tests/demoblaze_admintest.spec.js

Update the test data only. Do NOT change any steps or page objects.

New values:
- Category:     <new-category>
- Product Name: <new-product>
- Order Name:   <new-name>
- Country:      <new-country>
- City:         <new-city>
- Credit Card:  <new-card>
- Month:        <new-month>
- Year:         <new-year>
```

---

## npm Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (headless) |
| `npm run test:headed` | Run all tests with browser visible |
| `npm run test:debug` | Step-through with Playwright Inspector |
| `npm run report` | Open HTML test report in browser |
| `npx playwright test tests/<file>.spec.js --headed` | Run a single specific file |

---

## Screenshots

Confirmation screenshots are saved automatically to:
```
/screenshots/order-confirmation-<timestamp>.png
```
