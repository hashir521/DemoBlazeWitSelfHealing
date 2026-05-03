// @ts-check
const { BasePage } = require('./BasePage');

/**
 * LoginPage — handles the Log In modal popup.
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.modal         = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginButton   = page.locator('#logInModal .btn-primary');
  }

  async waitForModal() {
    await this.waitForVisible('#logInModal');
  }

  async enterUsername(username) {
    await this.slowType('#loginusername', username);
  }

  async enterPassword(password) {
    await this.slowType('#loginpassword', password);
  }

  async clickLogin() {
    await this.loginButton.click();
    await this.waitFor(2000);
  }

  /** Full login flow in one call */
  async login(username, password) {
    await this.waitForModal();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }
}

module.exports = { LoginPage };
