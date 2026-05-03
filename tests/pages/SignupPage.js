// @ts-check
const { BasePage } = require('./BasePage');

/**
 * SignupPage — handles the Sign Up modal popup.
 */
class SignupPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.modal          = page.locator('#signInModal');
    this.usernameInput  = page.locator('#sign-username');
    this.passwordInput  = page.locator('#sign-password');
    this.signupButton   = page.locator('#signInModal .btn-primary');
  }

  async waitForModal() {
    await this.waitForVisible('#signInModal');
    await this.waitFor(1000);
  }

  async enterUsername(username) {
    await this.slowType('#sign-username', username);
  }

  async enterPassword(password) {
    await this.slowType('#sign-password', password);
    await this.waitFor(1000);
  }

  async clickSignup() {
    // Register dialog handler BEFORE clicking — alert fires right after
    this.registerDialogHandler();
    await this.signupButton.click();
    await this.waitFor(1500); // wait for alert to be handled
    // Close the modal explicitly so it doesn't block further actions
    await this.closeModal();
  }

  async closeModal() {
    try {
      // Click the X close button on the modal
      await this.page.click('#signInModal .close', { timeout: 3000 });
      await this.waitFor(500);
    } catch {
      // Modal may have already closed — press Escape as fallback
      await this.page.keyboard.press('Escape');
      await this.waitFor(500);
    }
    // Wait until modal is fully hidden
    await this.page.waitForSelector('#signInModal', { state: 'hidden', timeout: 5000 });
  }

  /** Full signup flow in one call */
  async signup(username, password) {
    await this.waitForModal();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSignup();
  }
}

module.exports = { SignupPage };
