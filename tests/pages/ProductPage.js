// @ts-check
const { BasePage } = require('./BasePage');

/**
 * ProductPage — actions on the individual product detail page.
 */
class ProductPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.productName   = page.locator('h2.name');
    this.productPrice  = page.locator('h3.price-container');
    this.addToCartBtn  = page.locator('.btn-success:has-text("Add to cart")');
  }

  async getProductName() {
    return await this.productName.textContent();
  }

  async getProductPrice() {
    const raw = await this.productPrice.textContent();
    // Extract numeric value e.g. "$400 *includes tax" → "400"
    const match = raw.match(/\d+/);
    return match ? match[0] : raw;
  }

  async clickAddToCart() {
    // Register dialog handler BEFORE clicking — alert fires right after
    this.registerDialogHandler();
    await this.addToCartBtn.click();
    await this.waitFor(1500);
  }
}

module.exports = { ProductPage };
