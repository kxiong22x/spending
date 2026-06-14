// Formats a YYYY-MM string into a human-readable month and year (e.g. "March 2025").
export function formatMonth(yearMonth) {
  const [year, month] = yearMonth.split('-');
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Formats a number as a dollar amount string (e.g. 3.5 → "$3.50").
export function formatDollar(amount) {
  return `$${amount.toFixed(2)}`;
}

// Formats a fraction as a percentage string with one decimal place (e.g. 0.333 → "33.3%").
export function formatPercent(fraction) {
  return `${(fraction * 100).toFixed(1)}%`;
}
