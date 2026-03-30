export const DATE_ALIASES        = ['date', 'transaction date', 'trans. date', 'posted date', 'post date'];
export const AMOUNT_ALIASES      = ['amount', 'debit', 'transaction amount', 'charge amount'];
export const DESCRIPTION_ALIASES = ['description', 'original description', 'memo', 'payee', 'merchant', 'name'];
export const CATEGORY_ALIASES    = ['category'];

// Substrings that identify credit card payment rows, which should be excluded from spending data.
export const AUTOPAY_PATTERNS = [
  'autopay',
  'automatic payment',
  'online payment',
  'payment thank you',
  'payment received',
  'payment - thank you',
  'mobile payment',
  'e-payment',
  'web payment',
  'bill payment',
  'directpay',
  'credit card payment',
  'balance transfer',
];

// Splits a single CSV line into fields, correctly handling quoted fields and escaped quotes.
export function parseLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

// Normalizes M/D/YY, M/D/YYYY, or YYYY-MM-DD date strings to YYYY-MM-DD; returns null on failure.
export function normaliseDate(raw) {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const year = y.length === 2 ? '20' + y : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

// Strips leading "$" and commas from a string and converts it to a float.
export function parseAmount(raw) {
  const cleaned = raw.trim().replace(/^\$/, '').replace(/,/g, '');
  return parseFloat(cleaned);
}

// Returns the index of the first header that matches any alias, or -1 if none match.
export function findCol(headers, aliases) {
  for (const alias of aliases) {
    const idx = headers.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

// Parses a full CSV string into normalized row objects; returns rows plus a count of unparseable lines.
export function parseCSV(text) {
  const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim() !== '');
  if (lines.length < 2) return { rows: [], error: 'CSV has no data rows.' };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
  const dateIdx        = findCol(headers, DATE_ALIASES);
  const amountIdx      = findCol(headers, AMOUNT_ALIASES);
  const descriptionIdx = findCol(headers, DESCRIPTION_ALIASES);
  const categoryIdx    = findCol(headers, CATEGORY_ALIASES);

  if (dateIdx === -1) return { rows: [], error: 'Could not find a date column. Expected one of: ' + DATE_ALIASES.join(', ') };
  if (amountIdx === -1) return { rows: [], error: 'Could not find an amount column. Expected one of: ' + AMOUNT_ALIASES.join(', ') };

  const rows = [];
  let parseErrors = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i]);
    const date   = normaliseDate(fields[dateIdx]   ?? '');
    const amount = parseAmount(fields[amountIdx]   ?? '');
    if (!date || isNaN(amount)) { parseErrors++; continue; }
    const desc = descriptionIdx !== -1 ? (fields[descriptionIdx] ?? '').toLowerCase() : '';
    if (AUTOPAY_PATTERNS.some(p => desc.includes(p))) {
      console.log('[csv] skipped autopay row:', fields[descriptionIdx] ?? '(no description)');
      continue;
    }
    rows.push({
      date,
      amount,
      description: descriptionIdx !== -1 ? (fields[descriptionIdx] ?? '') : '',
      raw_category: categoryIdx   !== -1 ? (fields[categoryIdx]    ?? '') : null,
    });
  }

  // If the majority of amounts are negative, the file uses the opposite sign convention
  // (charges negative, refunds positive). Negate all amounts to normalise.
  const negativeCount = rows.filter(r => r.amount < 0).length;
  if (negativeCount > rows.length / 2) {
    for (const row of rows) row.amount = -row.amount;
  }

  return { rows, parseErrors };
}
