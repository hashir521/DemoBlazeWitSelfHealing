/**
 * ollamaClient.js
 * HTTP client for the local Ollama API.
 * Handles only Ollama — provider routing lives in aiClient.js.
 */

const OLLAMA_URL    = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama3';

/**
 * Send a prompt to the local Ollama instance and return the response text.
 *
 * @param {string} prompt    - The prompt to send.
 * @param {string} [model]   - Ollama model name (default: llama3).
 * @param {object} [options] - Extra params forwarded to the API body.
 * @returns {Promise<string>}
 */
async function askOllama(prompt, model = DEFAULT_MODEL, options = {}) {
  const body = {
    model,
    prompt,
    stream: false,
    ...options,
  };

  let response;
  try {
    response = await fetch(OLLAMA_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Failed to reach Ollama at ${OLLAMA_URL}.\n` +
      `Make sure Ollama is running: ollama serve\n` +
      `Original error: ${err.message}`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (typeof data.response !== 'string') {
    throw new Error(`Unexpected Ollama response shape: ${JSON.stringify(data)}`);
  }

  return data.response.trim();
}

module.exports = { askOllama };
