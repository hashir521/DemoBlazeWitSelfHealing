# Playwright UI Automation — Prompt Template

Use this file to give plain English steps to Kiro (AI).
Fill in the placeholders and paste the prompt block into the chat.

---

## How to Use

1. Copy the **Prompt Block** below
2. Replace all `<placeholders>` with your actual values
3. Paste it into Kiro chat
4. Kiro will generate a full Playwright test using the POM structure

---

## Prompt Block

```
I need a Playwright (JavaScript) test using the Page Object Model (POM) structure.

Create the test in: tests/<test-file-name>.spec.js
Create/update page objects in: tests/pages/

--- TEST DATA ---
URL:           <your-url>
Username:      <your-username>
Password:      <your-password>
Category:      <category-name>        (e.g. Monitors, Phones, Laptops)
Product Name:  <product-name>         (e.g. Apple monitor 24)

--- STEPS ---
1.  Open the URL and wait 2 seconds
2.  Click on "Sign up" link in the top-right navbar and wait 1 second
3.  A signup popup opens — wait 1 second
4.  Enter username: "<your-username>" in the username field
5.  Enter password: "<your-password>" in the password field and wait 1 second
6.  Click the "Sign up" button — a browser alert popup will appear, click OK and wait 1 second
7.  Click on "Log in" link in the navbar and wait 1 second
8.  A login popup opens — enter username: "<your-username>" and password: "<your-password>"
9.  Click the "Log in" button and wait 2 seconds
10. Verify the navbar shows the logged-in username
11. Click on "Home" in the navbar and wait 1 second
12. Scroll down slowly (two steps), then scroll back to top and wait 1 second
13. Click on "<category-name>" under the CATEGORIES section on the left sidebar and wait 1 second
14. Click on the product card titled "<product-name>" and wait 1 second
15. Verify the product page heading contains "<product-name>"
16. Note the product price displayed on the page
17. Click "Add to cart" button — a browser alert popup will appear, click OK and wait 1.5 seconds
18. Click on "Cart" link in the navbar and wait 3 seconds
19. Wait for the cart table to load
20. Read the Total price shown at the bottom of the cart
21. Verify the Total price is greater than 0
22. Verify the Total price matches the product price noted in step 16
23. Log the result: "Total price $X matches product price $X"

--- NOTES ---
- Use Page Object Model (POM): one class per page in tests/pages/
- All page objects must extend BasePage (tests/pages/BasePage.js)
- Register page.once('dialog') BEFORE the action that triggers the alert
- Use waitForTimeout() between steps as specified above
- Run in headed mode (browser visible) — headless: false in config
- Add console.log() for key values (price, username, total)
```

---

## Current Page Objects (POM Structure)

| File                        | Responsibility                          |
|-----------------------------|-----------------------------------------|
| `tests/pages/BasePage.js`   | Shared helpers: click, fill, scroll, dialog handler |
| `tests/pages/NavbarPage.js` | Top navbar: signup, login, home, cart links |
| `tests/pages/SignupPage.js` | Sign Up modal: fill form, submit        |
| `tests/pages/LoginPage.js`  | Log In modal: fill form, submit         |
| `tests/pages/HomePage.js`   | Product listing: categories, product cards, scroll |
| `tests/pages/ProductPage.js`| Product detail: name, price, add to cart |
| `tests/pages/CartPage.js`   | Cart: total price, item count, verify   |

---

## npm Commands

| Command                  | Description                        |
|--------------------------|------------------------------------|
| `npm test`               | Run all tests (headless)           |
| `npm run test:headed`    | Run with browser visible           |
| `npm run test:debug`     | Step-through with Playwright inspector |
| `npm run report`         | Open HTML test report              |

---

## Example — Filled Prompt

```
I need a Playwright (JavaScript) test using the Page Object Model (POM) structure.

Create the test in: tests/demoblaze.spec.js

--- TEST DATA ---
URL:           https://www.demoblaze.com/
Username:      hashiradmin
Password:      admin
Category:      Monitors
Product Name:  Apple monitor 24

--- STEPS ---
(same steps as above)
```
