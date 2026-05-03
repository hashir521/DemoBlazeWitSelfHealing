/**
 * scripts/testOllama.js
 *
 * Manual test for the AI client.
 * Tests whichever provider is currently active (Ollama or Groq).
 *
 * Run locally (Ollama):
 *   node scripts/testOllama.js
 *
 * Run with Groq:
 *   AI_PROVIDER=groq GROQ_API_KEY=your_key node scripts/testOllama.js
 */

const { askAI } = require('../ai-service/aiClient');

const TESTS = [
  {
    label:  'Basic question',
    prompt: 'Reply with exactly three words: AI is working.',
  },
  {
    label:  'Selector fix',
    prompt: "Fix this broken XPath and return only the corrected selector: //button[@id='loginn']",
  },
  {
    label:   'Low temperature',
    prompt:  'What is 2 + 2? Answer with just the number.',
    options: { temperature: 0 },
  },
];

(async () => {
  const provider = (process.env.AI_PROVIDER || 'ollama').toUpperCase();
  console.log(`=== AI Client Test (Provider: ${provider}) ===\n`);

  for (const t of TESTS) {
    console.log(`--- ${t.label} ---`);
    console.log('Prompt :', t.prompt);
    try {
      const response = await askAI(t.prompt, t.options ?? {});
      console.log('Response:', response);
    } catch (err) {
      console.error('ERROR   :', err.message);
    }
    console.log();
  }

  console.log('=== Done ===');
})();
