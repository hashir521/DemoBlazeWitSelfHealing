// @ts-check
const { BasePage } = require('./BasePage');

/**
 * NavbarPage — actions on the top navigation bar.
 */
class NavbarPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.signupLink  = page.locator('#signin2-BROKEN'); // ❌ intentionally broken for self-healing test
    this.loginLink   = page.locator('#login2');
    this.homeLink    = page.locator('a.nav-link[href="index.html"]');
    this.cartLink    = page.locator('#cartur');
    this.logoutLink  = page.locator('#logout2');
    this.welcomeUser = page.locator('#nameofuser');
  }

  async clickSignup() {
    await this.signupLink.click();
    await this.waitFor(1000);
  }

  async clickLogin() {
    await this.loginLink.click();
    await this.waitFor(1000);
  }

  async clickHome() {
    await this.homeLink.click();
    await this.waitFor(1000);
  }

  async clickCart() {
    await this.cartLink.click();
    await this.waitFor(3000);
  }

  async isLoggedIn() {
    return await this.welcomeUser.isVisible();
  }
}

module.exports = { NavbarPage };
