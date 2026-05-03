/**
 * reportAgent.js
 * Converts structured JSON logs from the self-healing flow into a
 * human-readable console summary and a persisted JSON report file.
 *
 * Each run APPENDS to reports/test-report.json so all scenarios in a
 * single Playwright run are captured together.
 *
 * Expected log events (emitted by selfHeal.js):
 *   original_failed  – original locator threw an error
 *   ai_suggestion    – Ollama returned a candidate locator
 *   ai_error         – Ollama call itself failed
 *   validation       – DOM count check result (passed | failed)
 *   outcome          – final result (healed | failed | fallback)
 */

const fs   = require('fs');
const path = require('path');

const REPORT_DIR  = path.resolve(__dirname, '..', 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'test-report.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findEvent(logs, eventName) {
  return logs.find(l => l.event === eventName) ?? null;
}

function countByField(logs, field, value) {
  return logs.filter(l => l[field] === value).length;
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Generate a report entry from structured log objects and append it to the
 * run-level report file.
 *
 * @param {object[]} logs      - Structured JSON events from one selfHeal call.
 * @param {string}  [testName] - Display name for this scenario.
 * @returns {object}           - The structured report entry.
 */
function generateReport(logs, testName = 'Self-Healing Locator Test') {
  if (!Array.isArray(logs) || logs.length === 0) {
    throw new Error('generateReport: logs must be a non-empty array');
  }

  const originalFailedEvent = findEvent(logs, 'original_failed');
  const aiSuggestionEvent   = findEvent(logs, 'ai_suggestion');
  const validationEvent     = findEvent(logs, 'validation');
  const outcomeEvent        = findEvent(logs, 'outcome');

  const originalLocator = originalFailedEvent?.originalLocator ?? 'N/A';
  const aiLocator       = aiSuggestionEvent?.aiLocator         ?? 'N/A';
  const validation      = validationEvent?.validation          ?? 'N/A';
  const finalStatus     = outcomeEvent?.status                 ?? 'failed';
  const aiFixUsed       = aiSuggestionEvent !== null;

  const passed = countByField(logs, 'status',     'healed')   +
                 countByField(logs, 'validation', 'passed');
  const failed = countByField(logs, 'status',     'failed')   +
                 countByField(logs, 'status',     'fallback')  +
                 countByField(logs, 'validation', 'failed');

  const entry = {
    testName,
    totalSteps:      logs.length,
    passed,
    failed,
    aiFixUsed,
    originalLocator,
    aiLocator,
    validation,
    finalStatus,
    timestamp:       new Date().toISOString(),
  };

  // ── Console summary ───────────────────────────────────────────────────────
  const statusLabel = finalStatus === 'healed' ? '✅ HEALED' : '❌ FAILED';
  const divider     = '='.repeat(52);

  console.log(`\n${divider}`);
  console.log('              TEST REPORT');
  console.log(divider);
  console.log(`  Scenario         : ${testName}`);
  console.log(`  Timestamp        : ${entry.timestamp}`);
  console.log(`  Total Log Events : ${entry.totalSteps}`);
  console.log(`  Passed           : ${passed}`);
  console.log(`  Failed           : ${failed}`);
  console.log(`  AI Fix Used      : ${aiFixUsed ? 'Yes' : 'No'}`);
  console.log(`  Original Locator : ${originalLocator}`);
  console.log(`  AI Locator Used  : ${aiLocator}`);
  console.log(`  Validation       : ${validation.toUpperCase()}`);
  console.log(`  Final Status     : ${statusLabel}`);
  console.log(`${divider}\n`);

  console.log('📋 Structured Report JSON:');
  console.log(JSON.stringify(entry, null, 2));

  appendReport(entry);

  return entry;
}

/**
 * Append one report entry to reports/test-report.json.
 * The file holds a JSON array; entries are appended so a full run
 * produces one file with all scenario results.
 */
function appendReport(entry) {
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    let existing = [];
    if (fs.existsSync(REPORT_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
    }

    existing.push(entry);
    fs.writeFileSync(REPORT_FILE, JSON.stringify(existing, null, 2), 'utf8');
    console.log(`💾 Report appended → ${REPORT_FILE} (${existing.length} total entries)\n`);
  } catch (err) {
    console.error('⚠️  Failed to save report file:', err.message);
  }
}

/**
 * Clear the report file at the start of a new test run.
 * Call this once from a global setup or the first beforeAll.
 */
function clearReport() {
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    fs.writeFileSync(REPORT_FILE, JSON.stringify([], null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️  Failed to clear report file:', err.message);
  }
}

module.exports = { generateReport, clearReport };
