// Sourced from shared/constants.json — edit that file to change values shared with the client.
const shared = require('../shared/constants.json');

const BUILTIN_CATEGORIES = shared.BUILTIN_CATEGORIES;
const BUILTIN_CATEGORIES_SET = new Set(BUILTIN_CATEGORIES);
// Lowercase set used for case-insensitive collision checks (e.g. reject "dining" if "Dining" is built-in)
const BUILTIN_CATEGORIES_LOWER_SET = new Set(BUILTIN_CATEGORIES.map(c => c.toLowerCase()));
const MONTH_REGEX = new RegExp(shared.YEAR_MONTH_PATTERN);
const DATE_REGEX = new RegExp(shared.DATE_PATTERN);
const MAX_NAME_LENGTH = shared.MAX_NAME_LENGTH;

module.exports = { BUILTIN_CATEGORIES, BUILTIN_CATEGORIES_SET, BUILTIN_CATEGORIES_LOWER_SET, MONTH_REGEX, DATE_REGEX, MAX_NAME_LENGTH };
