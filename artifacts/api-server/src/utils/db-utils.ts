export function sanitizeLikePattern(pattern: string): string {
  if (!pattern) return "";
  return pattern.replace(/[%_\\]/g, "\\$&");
}
