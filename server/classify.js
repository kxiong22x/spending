const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BUILTIN_CATEGORIES } = require('./constants');
const { db } = require('./db');

const VALID_CATEGORIES = BUILTIN_CATEGORIES;
const DEFAULT_DAILY_TOKEN_LIMIT = 1_000_000;

// Keyword fallback used when the Gemini API is unavailable
const KEYWORDS = require('./keywords.json');

// Returns the best-matching built-in category for a description using keyword matching.
function keywordFallback(description) {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) return category;
  }
  return 'other';
}

// Returns today's date as a YYYY-MM-DD string.
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Returns the number of Gemini tokens used today.
async function getTodayUsage() {
  const result = await db.execute({
    sql: 'SELECT tokens_used FROM gemini_usage WHERE date = ?',
    args: [today()],
  });
  return result.rows.length > 0 ? result.rows[0].tokens_used : 0;
}

// Adds tokensUsed to today's running Gemini token total.
async function recordUsage(tokensUsed) {
  await db.execute({
    sql: `INSERT INTO gemini_usage (date, tokens_used) VALUES (?, ?)
          ON CONFLICT(date) DO UPDATE SET tokens_used = tokens_used + excluded.tokens_used`,
    args: [today(), tokensUsed],
  });
}

// Normalizes a transaction description into a stable lookup pattern.
function extractPattern(description) {
  return description
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Classifies an array of transactions, checking learned rules before calling Gemini.
// Each item: { description, raw_category }
// learnedRules: Map<pattern, category> for the current user
// Returns: { categories: string[], matchedPatterns: string[] }
async function classifyTransactions(transactions, learnedRules = new Map()) {
  const categories = new Array(transactions.length);
  const matchedPatterns = [];
  const unknownIndexes = [];

  // Check learned rules first
  for (let i = 0; i < transactions.length; i++) {
    const pattern = extractPattern(transactions[i].description || '');
    if (learnedRules.has(pattern)) {
      categories[i] = learnedRules.get(pattern);
      matchedPatterns.push(pattern);
    } else {
      unknownIndexes.push(i);
    }
  }

  if (unknownIndexes.length === 0) {
    return { categories, matchedPatterns };
  }

  const unknownTransactions = unknownIndexes.map(i => transactions[i]);
  let unknownCategories;

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_AI_API_KEY not set — falling back to keyword classification');
    unknownCategories = unknownTransactions.map(t => keywordFallback(t.description));
  } else {
    const limit = parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT ?? DEFAULT_DAILY_TOKEN_LIMIT, 10);
    const used = await getTodayUsage();
    if (used >= limit) {
      throw new Error(`Gemini daily token limit of ${limit.toLocaleString()} reached (used: ${used.toLocaleString()}). Uploads are disabled until tomorrow.`);
    }
    unknownCategories = await classifyWithGemini(unknownTransactions);
  }

  for (let j = 0; j < unknownIndexes.length; j++) {
    categories[unknownIndexes[j]] = unknownCategories[j];
  }

  return { categories, matchedPatterns };
}

// Sends transactions to Gemini for classification, falling back to keywords on failure.
async function classifyWithGemini(transactions) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const lines = transactions
    .map((t, i) => {
      const hint = t.raw_category ? ` [bank category: ${t.raw_category}]` : '';
      return `${i + 1}. ${t.description || '(no description)'}${hint}`;
    })
    .join('\n');

  const prompt = `Classify each credit card transaction below into exactly one of these categories:
dining, groceries, shopping, entertainment, transportation, other

Rules:
- If a bank category hint is provided, use it as a signal but let the description take priority
- Return ONLY a valid JSON array of strings, one per transaction, in the same order as the input
- Every element must be exactly one of the six valid category names

Transactions:
${lines}`;

  try {
    const result = await model.generateContent(prompt);

    const tokenCount = result.response.usageMetadata?.totalTokenCount;
    if (tokenCount) await recordUsage(tokenCount);

    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const categories = JSON.parse(json);

    if (!Array.isArray(categories) || categories.length !== transactions.length) {
      throw new Error('Unexpected response length from Gemini');
    }

    return categories.map(c => (VALID_CATEGORIES.includes(c) ? c : 'other'));
  } catch (err) {
    console.error('Gemini classification failed, falling back to keywords:', err.message);
    return transactions.map(t => keywordFallback(t.description));
  }
}

module.exports = { classifyTransactions, extractPattern };
