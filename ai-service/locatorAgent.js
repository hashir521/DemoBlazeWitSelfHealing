/**
 * locatorAgent.js
 * Uses AI (Ollama locally, Groq in CI) to repair a broken Playwright locator.
 * Provider is selected automatically via the AI_PROVIDER environment variable.
 */

const { askAI } = require('./aiClient');

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

/**
 * Infer the likely element type and expected action from the broken locator
 * so the AI is steered toward the right kind of element.
 *
 * @param {string} locator
 * @returns {{ elementType: string, action: string }}
 */
function inferElementHint(locator) {
  const l = locator.toLowerCase();

  // Explicit input-type signals
  const inputKeywords = [
    'input', 'username', 'user-name', 'uname', 'email', 'mail',
    'password', 'passwd', 'pass', 'search', 'query', 'text', 'field',
  ];
  const buttonKeywords = [
    'button', 'btn', 'submit', 'login-button', 'login_button',
    'sign-in', 'signin', 'log-in', 'logout',
  ];
  const linkKeywords = ['link', 'anchor', 'href', 'nav'];

  if (inputKeywords.some(k => l.includes(k))) {
    return { elementType: 'input or textarea (fillable field)', action: 'fill / type' };
  }
  if (buttonKeywords.some(k => l.includes(k))) {
    return { elementType: 'button or submit input', action: 'click' };
  }
  if (linkKeywords.some(k => l.includes(k))) {
    return { elementType: 'anchor link', action: 'click' };
  }

  // XPath tag hint
  const xpathTag = locator.match(/\/\/(\w+)/);
  if (xpathTag) {
    const tag = xpathTag[1].toLowerCase();
    if (tag === 'input')    return { elementType: 'input field', action: 'fill / type' };
    if (tag === 'button')   return { elementType: 'button', action: 'click' };
    if (tag === 'a')        return { elementType: 'anchor link', action: 'click' };
    if (tag === 'select')   return { elementType: 'select dropdown', action: 'selectOption' };
    return { elementType: tag, action: 'interact' };
  }

  return { elementType: 'interactive element', action: 'interact' };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(locator, dom) {
  // Infer the expected element type from the broken locator so the AI
  // targets the right kind of element (input vs button, etc.)
  const hint = inferElementHint(locator);

  return `You are a QA automation expert specialising in Playwright test stability.

════════════════════════════════════════
OUTPUT RULE (non-negotiable):
  Return EXACTLY one selector — nothing else.
  No explanation. No markdown. No code fences. No surrounding quotes.
  No trailing punctuation or whitespace.
════════════════════════════════════════

ELEMENT TYPE CONTEXT:
  The broken locator appears to target: ${hint.elementType}
  Expected action on this element    : ${hint.action}
  ⚠ Your selector MUST match an element of this type.
  Do NOT return a selector for a different element type.
  Example: if the action is "fill", return a selector for an <input> or <textarea>,
           NOT for a <button> or <a>.

════════════════════════════════════════
SELECTOR PRIORITY — always pick the highest available option
that matches the expected element type above:

  1. data-test or data-testid attribute  ← MOST PREFERRED
       CORRECT:  [data-test="login-button"]
       CORRECT:  [data-testid="submit-btn"]
       ✗ WRONG:  data-test="login-button        ← missing brackets, unclosed quote
       ✗ WRONG:  data-testid=submit-btn          ← missing brackets and quotes

  2. Stable, meaningful id attribute
       CORRECT:  #login-button
       ✗ WRONG:  Skip if id looks auto-generated (e.g. id="comp-1a2b3c")

  3. Playwright ARIA role selector
       CORRECT:  role=button[name="Log in"]
       Use only when a clear visible label or accessible name exists.

  4. Clean, semantic CSS selector
       CORRECT:  form.login-form input[name="username"]
       Must be short and tied to structure — not to visual styling classes.

  5. XPath — LAST RESORT ONLY
       CORRECT:  //button[@type="submit"]
       ✗ WRONG:  //button[@type="submit"    ← unclosed bracket

════════════════════════════════════════
FORBIDDEN — never return any of these:
  ✗ Partial attribute selectors missing [ or ]
  ✗ Unclosed quotes in any selector
  ✗ Dynamic / generated class names  (e.g. css-1a2b3c, sc-bdVTJa)
  ✗ Positional indexes               (e.g. :nth-child(2), [1])
  ✗ Selector chains deeper than 3 levels
  ✗ A selector that targets the WRONG element type (e.g. button when input needed)
════════════════════════════════════════

SELF-CHECK — before you respond, verify:
  ✔ Does the selector start and end correctly?
  ✔ Are all brackets [ ] balanced?
  ✔ Are all quotes opened and closed?
  ✔ Is it a single selector with no extra text?
  ✔ Does it target a ${hint.elementType} element, not something else?
  If any check fails, correct the selector before returning it.

BROKEN LOCATOR:
${locator}

PAGE DOM SNAPSHOT:
${dom}

YOUR RESPONSE (one valid selector only):`;
}

// ---------------------------------------------------------------------------
// Post-processing sanitiser
// ---------------------------------------------------------------------------

/**
 * Strip markdown noise from the raw model response and return the first
 * non-empty line.
 */
function stripMarkdown(raw) {
  return raw
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/`/g, '')              // stray backticks
    .replace(/^["']|["']$/g, '')    // surrounding quotes
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 0) ?? '';
}

/**
 * Repair the most common model mistake: returning a bare attribute expression
 * instead of a proper CSS attribute selector.
 *
 * Examples fixed:
 *   data-test="login-button"   →  [data-test="login-button"]
 *   data-testid=submit         →  [data-testid="submit"]
 *   data-test="login-button    →  [data-test="login-button"]   (unclosed quote)
 */
function fixAttributeSelector(selector) {
  // Already a valid CSS attribute selector or XPath — leave it alone
  if (selector.startsWith('[') || selector.startsWith('#') ||
      selector.startsWith('.') || selector.startsWith('//') ||
      selector.startsWith('role=')) {

    // Extra guard: catch the model mistake of prefixing an attribute selector
    // with a dot, e.g.  .data-test="foo"  →  [data-test="foo"]
    // Pattern: starts with "." then word chars, then "="
    const dotAttrPattern = /^\.([\w-]+)(=.+)$/;
    const dotMatch = selector.match(dotAttrPattern);
    if (dotMatch) {
      return `[${dotMatch[1]}${dotMatch[2]}]`;
    }

    return selector;
  }

  // Looks like a bare attribute expression: attr="value" or attr=value
  const attrPattern = /^([\w-]+)\s*=\s*"?([^"]*)"?$/;
  const match = selector.match(attrPattern);
  if (match) {
    const [, attr, value] = match;
    return `[${attr}="${value}"]`;
  }

  return selector;
}

/**
 * Ensure all brackets and quotes in the selector are balanced.
 * Returns the selector unchanged if it looks balanced, or attempts a minimal
 * repair (close unclosed bracket / quote).
 */
function balanceBracketsAndQuotes(selector) {
  let s = selector;

  // Close unclosed double-quote (odd number of " chars)
  const quoteCount = (s.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) s = s + '"';

  // Close unclosed square bracket
  const openBrackets  = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) s = s + ']';

  // Close unclosed XPath parenthesis
  const openParens  = (s.match(/\(/g) || []).length;
  const closeParens = (s.match(/\)/g) || []).length;
  if (openParens > closeParens) s = s + ')';

  return s;
}

/**
 * Full sanitisation pipeline applied to every model response.
 */
function sanitise(raw) {
  let s = stripMarkdown(raw);
  s = fixAttributeSelector(s);
  s = balanceBracketsAndQuotes(s);
  return s;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trim the DOM snapshot to a manageable size so the model isn't overwhelmed.
 * Strategy:
 *  1. Extract only the <nav> / <header> / <body> opening section (first 6 KB)
 *     because navigation links live near the top of the page.
 *  2. Hard-cap at MAX_DOM_CHARS to stay well within the model's context window.
 */
const MAX_DOM_CHARS = 6000;

function trimDom(dom) {
  // Try to isolate the navbar / header area first
  const navMatch = dom.match(/<nav[\s\S]{0,5000}/i) ||
                   dom.match(/<header[\s\S]{0,5000}/i);
  if (navMatch) {
    return navMatch[0].slice(0, MAX_DOM_CHARS);
  }
  // Fallback: just take the first MAX_DOM_CHARS characters
  return dom.slice(0, MAX_DOM_CHARS);
}

async function fixLocator(locator, dom) {
  if (!locator || typeof locator !== 'string') {
    throw new Error('fixLocator: locator must be a non-empty string');
  }
  if (!dom || typeof dom !== 'string') {
    throw new Error('fixLocator: dom must be a non-empty string');
  }

  const trimmedDom = trimDom(dom);
  const prompt = buildPrompt(locator.trim(), trimmedDom);

  // temperature 0.1 → near-deterministic, focused output
  const raw = await askAI(prompt, { temperature: 0.1 });
  const cleaned = sanitise(raw);

  if (!cleaned) {
    throw new Error(
      `locatorAgent: AI returned an empty or unparseable response.\nRaw: ${raw}`
    );
  }

  return cleaned;
}

module.exports = { fixLocator };
