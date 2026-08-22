// Lowercase, strip anything that isn't alphanumeric/space/hyphen, collapse
// whitespace and repeated hyphens into single hyphens, trim leading/trailing
// hyphens. Deliberately simple/ASCII-only - a real i18n product catalog
// would also transliterate accented characters instead of dropping them.
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = slugify;
