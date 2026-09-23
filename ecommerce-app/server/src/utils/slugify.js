/**
 * Converts a display name into a URL-safe slug.
 * "Home & Kitchen" -> "home-kitchen"
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // drop punctuation
    .replace(/\s+/g, '-')          // spaces become hyphens
    .replace(/-+/g, '-')           // collapse repeated hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

module.exports = { slugify };
