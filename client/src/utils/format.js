// Formats a YYYY-MM string into a human-readable month and year (e.g. "March 2025").
export function formatMonth(yearMonth) {
  const [year, month] = yearMonth.split('-');
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Formats a number as a dollar amount string (e.g. 3.5 → "$3.50").
export function formatDollar(amount) {
  return `$${amount.toFixed(2)}`;
}
