// @ts-check
const { BasePage } = require('./BasePage');
const path = require('path');
const fs   = require('fs');

/**
 * OrderPage — handles the "Place Order" modal and the purchase confirmation modal.
 *
 * Modal 1: Place Order form  (#orderModal)
 * Modal 2: Purchase confirmation  (.sweet-alert)
 */
class OrderPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Place Order modal locators ──────────────────────────────────────────
    this.orderModal    = page.locator('#orderModal');
    this.nameInput     = page.locator('#name');
    this.countryInput  = page.locator('#country');
    this.cityInput     = page.locator('#city');
    this.cardInput     = page.locator('#card');
    this.monthInput    = page.locator('#month');
    this.yearInput     = page.locator('#year');
    this.purchaseBtn   = page.locator('#orderModal button.btn-primary:has-text("Purchase")');

    // ── Purchase confirmation modal locators ────────────────────────────────
    this.confirmModal  = page.locator('.sweet-alert');
    this.confirmText   = page.locator('.sweet-alert p.lead');
    this.confirmOkBtn  = page.locator('.sweet-alert button.confirm');
  }

  // ── Place Order modal ─────────────────────────────────────────────────────

  async waitForOrderModal() {
    await this.waitForVisible('#orderModal');
    await this.waitFor(1000);
  }

  /**
   * Scroll inside the modal body by a given amount.
   * Uses the modal's scrollable container (.modal-body) so the page itself doesn't scroll.
   * @param {number} amount  pixels to scroll down
   */
  async scrollInsideModal(amount = 80) {
    await this.page.evaluate((px) => {
      const modalBody = document.querySelector('#orderModal .modal-body');
      if (modalBody) modalBody.scrollBy({ top: px, behavior: 'smooth' });
    }, amount);
    await this.waitFor(400); // brief pause so the scroll is visible
  }

  /**
   * Fill all fields in the Place Order form slowly, scrolling down after each
   * field so the user can follow along all the way to the Purchase button.
   * @param {{ name: string, country: string, city: string, card: string, month: string, year: string }} details
   */
  async fillOrderForm(details) {
    // Name
    await this.slowType('#name', details.name);
    await this.scrollInsideModal(60);

    // Country
    await this.slowType('#country', details.country);
    await this.scrollInsideModal(60);

    // City
    await this.slowType('#city', details.city);
    await this.scrollInsideModal(60);

    // Credit card
    await this.slowType('#card', details.card);
    await this.scrollInsideModal(60);

    // Month
    await this.slowType('#month', details.month);
    await this.scrollInsideModal(60);

    // Year — scroll a bit more to fully reveal the Purchase button
    await this.slowType('#year', details.year);
    await this.scrollInsideModal(100);

    // Final pause so the user can see all filled values before Purchase
    await this.waitFor(1000);
  }

  async clickPurchase() {
    await this.purchaseBtn.click();
    await this.waitFor(1500);
  }

  // ── Purchase confirmation modal ───────────────────────────────────────────

  async waitForConfirmModal() {
    await this.waitForVisible('.sweet-alert');
    await this.waitFor(1000);
  }

  /**
   * Capture a screenshot of the confirmation modal and save it to /screenshots.
   * @param {string} filename  e.g. 'order-confirmation'
   * @returns {string} full path to the saved screenshot
   */
  async captureConfirmationScreenshot(filename = 'order-confirmation') {
    const dir = path.resolve('screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath   = path.join(dir, `${filename}-${timestamp}.png`);

    await this.confirmModal.screenshot({ path: filePath });
    console.log(`[Screenshot] Saved → ${filePath}`);
    return filePath;
  }

  /**
   * Extract and return all key values from the confirmation modal.
   * The modal text looks like:
   *   "Id: 1234\nAmount: 400 USD\nCard Number: 4242424242\nName: Hashir\nDate: 23/4/2026"
   *
   * @returns {{ id: string, amount: string, cardNumber: string, name: string, date: string }}
   */
  async getConfirmationDetails() {
    const raw = await this.confirmText.textContent();
    console.log(`[Confirmation] Raw text:\n${raw}`);

    const extract = (label) => {
      // Match value between this label and the next label (or end of string)
      // e.g. "Id: 9440347Amount: 400 USD" → label=Id → "9440347"
      const match = raw.match(new RegExp(`${label}:\\s*([^\\n]+?)(?=\\s*(?:Id|Amount|Card Number|Name|Date):|$)`));
      return match ? match[1].trim() : 'N/A';
    };

    const details = {
      id:         extract('Id'),
      amount:     extract('Amount'),
      cardNumber: extract('Card Number'),
      name:       extract('Name'),
      date:       extract('Date'),
    };

    console.log('─────────────────────────────────────');
    console.log('[Order Confirmation Details]');
    console.log(`  ID          : ${details.id}`);
    console.log(`  Amount      : ${details.amount}`);
    console.log(`  Card Number : ${details.cardNumber}`);
    console.log(`  Name        : ${details.name}`);
    console.log(`  Date        : ${details.date}`);
    console.log('─────────────────────────────────────');

    return details;
  }

  async clickOk() {
    await this.confirmOkBtn.click();
    await this.waitFor(1000);
  }
}

module.exports = { OrderPage };
