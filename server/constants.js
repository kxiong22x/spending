// Canonical list of built-in spending categories, shared across the server.
const BUILTIN_CATEGORIES = ['dining', 'groceries', 'shopping', 'entertainment', 'transportation', 'other'];
const BUILTIN_CATEGORIES_SET = new Set(BUILTIN_CATEGORIES);

// Shared regex patterns for validating date strings.
const MONTH_REGEX = /^\d{4}-\d{2}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Maximum length for user-supplied name fields (cards, categories).
const MAX_NAME_LENGTH = 50;

module.exports = { BUILTIN_CATEGORIES, BUILTIN_CATEGORIES_SET, MONTH_REGEX, DATE_REGEX, MAX_NAME_LENGTH };
