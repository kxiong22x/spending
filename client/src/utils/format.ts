// Formats a YYYY-MM string into a human-readable month and year (e.g. "March 2025").
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Formats a number as a dollar amount string (e.g. 3.5 → "$3.50").
export function formatDollar(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Formats a fraction as a percentage string with one decimal place (e.g. 0.333 → "33.3%").
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}
