import { GoogleGenerativeAI } from '@google/generative-ai';
import { BUILTIN_CATEGORIES } from './constants';
import { getTodayUsage, recordUsage, getDailyTokenLimit } from './geminiTokenUsage';

// Keyword fallback used when the Gemini API is unavailable
import KEYWORDS from './keywords.json';

interface TransactionInput {
  description: string;
  raw_category?: string | null;
}

// Returns the best-matching built-in category for a description using keyword matching.
function keywordFallback(description: string): string {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS as Record<string, string[]>)) {
    if (keywords.some(kw => desc.includes(kw))) return category;
  }
  return 'Other';
}

// Normalizes a transaction description into a stable lookup pattern.
function extractPattern(description: string): string {
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
async function classifyTransactions(
  transactions: TransactionInput[],
  learnedRules: Map<string, string> = new Map()
): Promise<{ categories: string[]; matchedPatterns: string[] }> {
  const categories: string[] = new Array(transactions.length);
  const matchedPatterns: string[] = [];
  const unknownIndexes: number[] = [];

  // Check learned rules first
  for (let i = 0; i < transactions.length; i++) {
    const pattern = extractPattern(transactions[i].description || '');
    if (learnedRules.has(pattern)) {
      categories[i] = learnedRules.get(pattern)!;
      matchedPatterns.push(pattern);
    } else {
      unknownIndexes.push(i);
    }
  }

  if (unknownIndexes.length === 0) {
    return { categories, matchedPatterns };
  }

  const unknownTransactions = unknownIndexes.map(i => transactions[i]);
  let unknownCategories: string[];

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_AI_API_KEY not set — falling back to keyword classification');
    unknownCategories = unknownTransactions.map(t => keywordFallback(t.description));
  } else {
    const limit = getDailyTokenLimit();
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
async function classifyWithGemini(transactions: TransactionInput[]): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const lines = transactions
    .map((t, i) => {
      const hint = t.raw_category ? ` [bank category: ${t.raw_category}]` : '';
      return `${i + 1}. ${t.description || '(no description)'}${hint}`;
    })
    .join('\n');

  const prompt = `Classify each credit card transaction below into exactly one of these categories:
${BUILTIN_CATEGORIES.join(', ')}

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
    const categories: unknown = JSON.parse(json);

    if (!Array.isArray(categories) || categories.length !== transactions.length) {
      throw new Error('Unexpected response length from Gemini');
    }

    return (categories as string[]).map(c => (BUILTIN_CATEGORIES.includes(c) ? c : 'Other'));
  } catch (err) {
    console.error('Gemini classification failed, falling back to keywords:', (err as Error).message);
    return transactions.map(t => keywordFallback(t.description));
  }
}

export { classifyTransactions, extractPattern };
