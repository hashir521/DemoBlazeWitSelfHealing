// @ts-check

/**
 * BasePage — shared helper methods inherited by all page objects.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(path = '/') {
    await this.page.goto(path);
    // Animate browser into maximized/full mode after page opens
    await this.page.evaluate(() => {
      window.moveTo(0, 0);
      window.resizeTo(screen.availWidth, screen.availHeight);
    });
    await this.page.waitForTimeout(600); // brief pause so the resize is visible
  }

  async waitFor(ms) {
    await this.page.waitForTimeout(ms);
  }

  async click(selector) {
    await this.page.click(selector);
  }

  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  /**
   * Type into a field slowly, character by character, so the user can watch.
   * @param {string} selector
   * @param {string} value
   * @param {number} delay  ms between each keystroke (default 80ms)
   */
  async slowType(selector, value, delay = 80) {
    await this.page.click(selector);          // focus the field first
    await this.page.fill(selector, '');       // clear any existing value
    await this.page.type(selector, value, { delay });
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async waitForVisible(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  async scrollDown(amount = 800) {
    await this.page.evaluate((px) => window.scrollBy({ top: px, behavior: 'smooth' }), amount);
  }

  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /**
   * Generate a unique random username with a given prefix.
   * e.g. generateUsername('user') → 'user_k7x2m9'
   * @param {string} prefix
   * @returns {string}
   */
  generateUsername(prefix = 'user') {
    const random = Math.random().toString(36).substring(2, 8); // 6 random alphanumeric chars
    return `${prefix}_${random}`;
  }

  /** Accept a browser alert dialog — must be registered BEFORE the triggering action */
  registerDialogHandler() {
    this.page.once('dialog', async (dialog) => {
      console.log(`[Dialog] ${dialog.message()}`);
      await dialog.accept();
      // Wait 1.5 seconds after accepting so the user can see the popup was handled
      await this.page.waitForTimeout(1500);
    });
  }
}

module.exports = { BasePage };
