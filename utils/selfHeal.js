const { fixLocator }     = require('../ai-service/locatorAgent');
const { generateReport } = require('../ai-service/reportAgent');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Emit a human-readable console line, push a structured entry to the log
 * collector, and print the JSON entry.
 */
function log(collector, emoji, message, fields = {}) {
  const entry = { timestamp: new Date().toISOString(), message, ...fields };
  collector.push(entry);
  console.log(`${emoji} ${message}`);
  console.log(JSON.stringify(entry, null, 2));
}

/**
 * Last-resort DOM heuristic: scan the page for elements whose id, name,
 * data-test, or data-testid contains any word from the broken locator.
 * Returns the first stable CSS selector found, or null.
 *
 * This runs only when the AI locator fails validation, giving the system
 * one extra recovery attempt before falling back to the original error.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} brokenLocator
 * @returns {Promise<string|null>}
 */
async function domHeuristicFallback(page, brokenLocator) {
  // Extract meaningful words (≥4 chars) from the broken locator
  const words = brokenLocator
    .replace(/[^a-zA-Z0-9\s-_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4);

  if (words.length === 0) return null;

  for (const word of words) {
    const lower = word.toLowerCase();

    // Try stable attribute selectors in priority order
    const candidates = [
      `[data-testid*="${lower}"]`,
      `[data-test*="${lower}"]`,
      `[id*="${lower}"]`,
      `[name*="${lower}"]`,
    ];

    for (const candidate of candidates) {
      try {
        const count = await page.locator(candidate).count();
        if (count === 1) return candidate; // unambiguous match only
      } catch {
        // invalid selector — skip
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Self-healing wrapper for Playwright actions.
 *
 * Flow:
 *  1. Try original locator
 *  2. On failure → ask AI for a replacement
 *  3. Validate AI locator exists on the page (count >= 1)
 *  4a. PASS  → retry action with AI locator           → status: "healed"
 *  4b. FAIL  → try DOM heuristic fallback
 *      4b-i.  Heuristic found → retry                 → status: "healed"
 *      4b-ii. Heuristic empty → throw original error  → status: "fallback"
 *  5. Generate report from collected logs
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}   locator   - The original (possibly broken) locator.
 * @param {Function} actionFn  - async (locator: string) => void
 * @param {string}  [testName] - Label shown in the report.
 */
async function selfHeal(page, locator, actionFn, testName) {
  const logs = [];

  // ── Step 1: try original locator ─────────────────────────────────────────
  try {
    await actionFn(locator);
    return; // nothing to heal
  } catch (originalError) {

    // Capture only the first line — Playwright stack traces are very long
    const errorMessage = originalError.message.split('\n')[0];

    // Classify the failure so logs are more informative
    const failureKind =
      errorMessage.includes('Timeout')           ? 'timeout'     :
      errorMessage.includes('not visible')        ? 'not-visible' :
      errorMessage.includes('not attached')       ? 'not-attached':
      errorMessage.includes('cannot be filled')   ? 'wrong-type'  :
      errorMessage.includes('strict mode')        ? 'ambiguous'   : 'error';

    log(logs, '🔴', 'Original locator failed', {
      event:           'original_failed',
      originalLocator: locator,
      failureKind,
      errorMessage,
    });

    // ── Step 2: ask AI for a replacement ─────────────────────────────────
    let aiLocator;
    try {
      const dom = await page.content();
      aiLocator = await fixLocator(locator, dom);

      log(logs, '🤖', `AI suggested locator: ${aiLocator}`, {
        event:           'ai_suggestion',
        originalLocator: locator,
        aiLocator,
      });
    } catch (aiError) {
      log(logs, '❌', `AI fix failed: ${aiError.message}`, {
        event:           'ai_error',
        originalLocator: locator,
        status:          'failed',
        errorMessage:    aiError.message,
      });
      generateReport(logs, testName);
      throw originalError;
    }

    // ── Step 3: validate AI locator ──────────────────────────────────────
    // Guard: if the AI returned a non-selector string (e.g. a sentence),
    // .count() will throw a parse error — treat that as validation failure.
    let aiCount = 0;
    try {
      aiCount = await page.locator(aiLocator).count();
    } catch (parseError) {
      log(logs, '⚠️ ', `AI locator is not a valid selector — trying DOM heuristic`, {
        event:           'validation',
        originalLocator: locator,
        aiLocator,
        validation:      'failed',
        parseError:      parseError.message.split('\n')[0],
      });
      aiCount = 0; // fall through to heuristic block below
    }

    if (aiCount === 0) {
      log(logs, '⚠️ ', 'AI locator not found — trying DOM heuristic', {
        event:           'validation',
        originalLocator: locator,
        aiLocator,
        validation:      'failed',
      });

      // ── Step 3b: DOM heuristic fallback ────────────────────────────────
      const heuristicLocator = await domHeuristicFallback(page, locator);

      if (heuristicLocator) {
        log(logs, '🔍', `DOM heuristic found: ${heuristicLocator}`, {
          event:           'heuristic_suggestion',
          originalLocator: locator,
          aiLocator:       heuristicLocator,
        });

        try {
          await actionFn(heuristicLocator);
          log(logs, '🎉', 'Self-healing successful via DOM heuristic', {
            event:           'outcome',
            originalLocator: locator,
            aiLocator:       heuristicLocator,
            validation:      'passed',
            status:          'healed',
          });
          generateReport(logs, testName);
          return;
        } catch {
          // heuristic action also failed — fall through to throw
        }
      }

      log(logs, '❌', 'Validation FAILED — no valid locator found, falling back', {
        event:           'outcome',
        originalLocator: locator,
        aiLocator,
        validation:      'failed',
        status:          'fallback',
        errorMessage,
      });
      generateReport(logs, testName);
      throw originalError;
    }

    log(logs, '✅', `Validation PASSED — ${aiCount} matching element(s) found`, {
      event:           'validation',
      originalLocator: locator,
      aiLocator,
      validation:      'passed',
      matchCount:      aiCount,
    });

    // ── Step 4: retry with validated AI locator ───────────────────────────
    try {
      await actionFn(aiLocator);

      log(logs, '🎉', 'Self-healing successful', {
        event:           'outcome',
        originalLocator: locator,
        aiLocator,
        validation:      'passed',
        status:          'healed',
      });

    } catch (retryError) {
      const retryMsg = retryError.message.split('\n')[0];

      // If the action explicitly says the element is the wrong type or hidden,
      // try one more AI call with that extra constraint in the error context
      const isWrongType = retryMsg.includes('not fillable') ||
                          retryMsg.includes('is hidden')    ||
                          retryMsg.includes('cannot be filled');

      if (isWrongType) {
        log(logs, '⚠️ ', `AI locator is wrong type/state — retrying AI with constraint`, {
          event:           'wrong_type_retry',
          originalLocator: locator,
          aiLocator,
          retryReason:     retryMsg,
        });

        try {
          const dom2        = await page.content();
          const constraint  = `IMPORTANT: The previous attempt returned "${aiLocator}" but it failed because: ${retryMsg}. Do NOT return that selector. Find a different element.`;
          const aiLocator2  = await fixLocator(`${locator}\n\n${constraint}`, dom2);

          log(logs, '🤖', `AI second suggestion: ${aiLocator2}`, {
            event:           'ai_suggestion_2',
            originalLocator: locator,
            aiLocator:       aiLocator2,
          });

          const count2 = await page.locator(aiLocator2).count();
          if (count2 > 0) {
            await actionFn(aiLocator2);
            log(logs, '🎉', 'Self-healing successful on second AI attempt', {
              event:           'outcome',
              originalLocator: locator,
              aiLocator:       aiLocator2,
              validation:      'passed',
              status:          'healed',
            });
            generateReport(logs, testName);
            return;
          }
        } catch {
          // second attempt also failed — fall through to original error
        }
      }

      log(logs, '❌', 'Retry failed even with valid AI locator', {
        event:           'outcome',
        originalLocator: locator,
        aiLocator,
        validation:      'passed',
        status:          'failed',
        errorMessage:    retryMsg,
      });
      generateReport(logs, testName);
      throw originalError;
    }

    // ── Step 5: report ────────────────────────────────────────────────────
    generateReport(logs, testName);
  }
}

module.exports = { selfHeal };
