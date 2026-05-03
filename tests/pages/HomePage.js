// @ts-check
const { BasePage } = require('./BasePage');

/**
 * HomePage — actions on the main product listing page.
 */
class HomePage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.categoriesList = page.locator('.list-group');
    this.productCards   = page.locator('.card-title a');
  }

  async scrollDownAndUp() {
    await this.scrollDown(800);
    await this.waitFor(1000);
    await this.scrollDown(800);
    await this.waitFor(1000);
    await this.scrollToTop();
    await this.waitFor(1000);
  }

  async clickCategory(categoryName) {
    await this.page.click(`a.list-group-item:has-text("${categoryName}")`);
    await this.waitFor(1000);
  }

  async clickProduct(productName) {
    await this.page.click(`.card-title a:has-text("${productName}")`);
    await this.waitFor(1000);
  }
}

module.exports = { HomePage };
