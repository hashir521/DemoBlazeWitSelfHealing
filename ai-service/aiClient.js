/**
 * aiClient.js
 *
 * Provider-agnostic AI client.
 * Decides which backend to use based on the AI_PROVIDER environment variable.
 *
 * Usage:
 *   const { askAI } = require('./aiClient');
 *   const result = await askAI(prompt);
 *
 * Environment variables:
 *   AI_PROVIDER=ollama   → local Ollama at http://localhost:11434  (default)
 *   AI_PROVIDER=groq     → Groq cloud API at https://api.groq.com
 *   GROQ_API_KEY=gsk_... → required when AI_PROVIDER=groq
 */

const { askOllama } = require('./ollamaClient');

// ── Groq configuration ───────────────────────────────────────────────────────

const GROQ_URL           = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Retry settings for 429 rate-limit responses
const MAX_RETRIES  = 3;
const BASE_DELAY_MS = 10000; // 10 s base — Groq free tier resets every 60 s

/**
 * Wait for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send a prompt to the Groq cloud API and return the response text.
 * Automatically retries up to MAX_RETRIES times on 429 rate-limit errors.
 *
 * @param {string} prompt    - The prompt to send.
 * @param {string} [model]   - Groq model name.
 * @param {object} [options] - Extra params: temperature, max_tokens.
 * @returns {Promise<string>}
 */
async function askGroq(prompt, model = GROQ_DEFAULT_MODEL, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY environment variable is not set.\n' +
      'Get a free key at https://console.groq.com\n' +
      'Then set it: export GROQ_API_KEY=your_key_here'
    );
  }

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.1,
    max_tokens:  options.max_tokens  ?? 300,
    stream:      false,
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let response;
    try {
      response = await fetch(GROQ_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`Failed to reach Groq API: ${err.message}`);
    }

    // ── Rate limit — wait and retry ────────────────────────────────────────
    if (response.status === 429) {
      const errorText = await response.text();

      // Parse retry-after from Groq error message if available
      // e.g. "Please try again in 2.865s"
      const retryMatch = errorText.match(/try again in ([\d.]+)s/);
      const waitMs = retryMatch
        ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000  // add 2 s buffer
        : BASE_DELAY_MS * attempt;                             // exponential fallback

      console.log(`⏳ Groq rate limit hit (attempt ${attempt}/${MAX_RETRIES}) — waiting ${waitMs / 1000}s before retry...`);
      lastError = new Error(`Groq API error 429: ${errorText}`);
      await sleep(waitMs);
      continue;
    }

    // ── Other HTTP errors ──────────────────────────────────────────────────
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    // ── Success ────────────────────────────────────────────────────────────
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== 'string') {
      throw new Error(`Unexpected Groq response shape: ${JSON.stringify(data)}`);
    }

    return text.trim();
  }

  // All retries exhausted
  throw lastError ?? new Error('Groq API: max retries exceeded');
}

// ── Unified entry point ──────────────────────────────────────────────────────

/**
 * Send a prompt to whichever AI provider is configured and return the text.
 *
 * Routing logic:
 *   AI_PROVIDER=ollama (or not set) → askOllama  (local, free, offline)
 *   AI_PROVIDER=groq                → askGroq    (cloud, retries on 429)
 *
 * @param {string} prompt    - The prompt to send.
 * @param {object} [options] - Extra params (temperature, max_tokens).
 * @returns {Promise<string>}
 */
async function askAI(prompt, options = {}) {
  const provider = (process.env.AI_PROVIDER || 'ollama').toLowerCase();

  if (provider === 'groq') {
    console.log('🌐 AI Provider: Groq (cloud)');
    return askGroq(prompt, GROQ_DEFAULT_MODEL, options);
  }

  // Default — Ollama
  console.log('🖥️  AI Provider: Ollama (local)');
  return askOllama(prompt, 'llama3', options);
}

module.exports = { askAI };
