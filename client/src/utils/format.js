// Formats a YYYY-MM string into a human-readable month and year (e.g. "March 2025").
export function formatMonth(yearMonth) {
  const [year, month] = yearMonth.split('-');
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}
