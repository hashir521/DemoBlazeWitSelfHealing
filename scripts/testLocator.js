const { fixLocator } = require("../ai-service/locatorAgent");

(async () => {
  try {
    const result = await fixLocator(
      "//button[@id='loginn']",
      "<html><body><button id='login'>Login</button></body></html>"
    );

    console.log("🔧 FIXED LOCATOR:\n", result);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();