/**
 * Sanitizes a string for use in SQL LIKE / ILIKE patterns.
 * Escapes special characters: %, _, and \.
 *
 * @param q The search term to sanitize.
 * @returns A sanitized string safe for LIKE / ILIKE.
 */
export function sanitizeLikePattern(q: unknown): string {
  if (q === null || q === undefined) return "";
  const str = String(q);
  // Escapes \, %, and _ by prefixing with a backslash.
  // We use a function for the second argument to avoid special meaning of $ in replacement strings.
  return str.replace(/[%_\\]/g, (char) => `\\${char}`);
}
