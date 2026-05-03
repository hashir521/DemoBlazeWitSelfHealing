// @ts-check
const { BasePage } = require('./BasePage');

/**
 * CartPage — actions and assertions on the shopping cart page.
 */
class CartPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.cartTable     = page.locator('#tbodyid');
    this.totalPrice    = page.locator('#totalp');
    this.placeOrderBtn = page.locator('button.btn-success:has-text("Place Order")');
    this.deleteButtons = page.locator('a:has-text("Delete")');
  }

  async waitForCartToLoad() {
    await this.waitForVisible('#tbodyid');
    await this.waitFor(1000);
  }

  async getTotalPrice() {
    const total = await this.totalPrice.textContent();
    return total ? total.trim() : '0';
  }

  async verifyTotalPrice(expectedPrice) {
    const actual = await this.getTotalPrice();
    console.log(`[Cart] Total price displayed: $${actual}`);
    if (expectedPrice) {
      const { expect } = require('@playwright/test');
      expect(actual).toBe(String(expectedPrice));
    }
    return actual;
  }

  async getCartItems() {
    return await this.cartTable.locator('tr').count();
  }

  /**
   * Delete all items from the cart so we start with a clean slate.
   * Safely handles an already-empty cart.
   */
  async clearCart() {
    // Wait a moment for the cart page to settle
    await this.waitFor(2000);

    // #tbodyid may be hidden when cart is empty — check if any rows exist first
    const rowCount = await this.page.locator('#tbodyid tr').count();
    if (rowCount === 0) {
      console.log('[Cart] Cart is already empty — nothing to clear');
      return;
    }

    let rows = rowCount;
    while (rows > 0) {
      await this.page.locator('#tbodyid tr td a:has-text("Delete")').first().click();
      await this.waitFor(1500);
      rows = await this.page.locator('#tbodyid tr').count();
    }
    console.log('[Cart] 🗑️  Cart cleared');
  }

  /** Click the green "Place Order" button to open the order modal */
  async clickPlaceOrder() {
    await this.placeOrderBtn.click();
    await this.waitFor(1000);
  }
}

module.exports = { CartPage };
