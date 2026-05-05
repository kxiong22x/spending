export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export const PIE_COLORS = [
  "#c8d6d3",
  "#5f9595",
  "#fdbaa8",
  "#f5d0c3",
  "#efbb68",
  "#abb8bd",
  "#f9d08c",
  "#f9e3de",
  "#f4dcce",
  "#88acab"
];

export const CATEGORY_ORDER = ['dining', 'groceries', 'shopping', 'entertainment', 'transportation', 'other'];
