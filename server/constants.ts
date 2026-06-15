// Sourced from shared/constants.json — edit that file to change values shared with the client.
import shared from '../shared/constants.json';

const BUILTIN_CATEGORIES: string[] = shared.BUILTIN_CATEGORIES;
const BUILTIN_CATEGORIES_SET = new Set(BUILTIN_CATEGORIES);
// Lowercase set used for case-insensitive collision checks (e.g. reject "dining" if "Dining" is built-in)
const BUILTIN_CATEGORIES_LOWER_SET = new Set(BUILTIN_CATEGORIES.map(c => c.toLowerCase()));
const MONTH_REGEX = new RegExp(shared.YEAR_MONTH_PATTERN);
const DATE_REGEX = new RegExp(shared.DATE_PATTERN);
const MAX_NAME_LENGTH: number = shared.MAX_NAME_LENGTH;
const MAX_DESCRIPTION_LENGTH: number = shared.MAX_DESCRIPTION_LENGTH;
const MAX_RULES_PER_USER: number = shared.MAX_RULES_PER_USER;
const AUTOPAY_PATTERNS: string[] = shared.AUTOPAY_PATTERNS;

export { BUILTIN_CATEGORIES, BUILTIN_CATEGORIES_SET, BUILTIN_CATEGORIES_LOWER_SET, MONTH_REGEX, DATE_REGEX, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_RULES_PER_USER, AUTOPAY_PATTERNS };
