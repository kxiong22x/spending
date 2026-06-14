import shared from '@shared/constants.json';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, '0');
export const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export const PIE_COLORS = [
  "#5f9595",
  "#fdbaa8",
  "#e8d87a",
  "#abb8bd",
  "#f2b8b8",
  "#c8d6d3",
  "#f0a96a",
  "#e8cdd4",
  "#88acab",
  "#f5e6ea"
];

export const CARD_PIE_COLORS = [
  "#a8a4aa", // gray mid-light
  "#6d4d67", // mauve mid-dark
  "#d0cdd1", // gray light
  "#82607b", // mauve mid
  "#38353a", // gray dark
  "#c9b5c5", // mauve light
  "#5e5b60", // gray mid-dark
  "#a888a0", // mauve mid-light
  "#807c82", // gray mid
  "#40283c", // mauve dark
];

// Sourced from shared/constants.json — must match server values
export const CATEGORY_ORDER: string[] = shared.BUILTIN_CATEGORIES;
export const MAX_NAME_LENGTH: number = shared.MAX_NAME_LENGTH;
export const YEAR_MONTH_REGEX = new RegExp(shared.YEAR_MONTH_PATTERN);
