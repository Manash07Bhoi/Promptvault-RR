## 2025-01-28 - ARIA Labels for Icon Buttons
**Learning:** Found multiple icon-only buttons (like clear search, remove item) without accessible names. Screen readers would just say "button" with no context.
**Action:** Always verify `aria-label` is present on `<button>` elements that only contain an icon (e.g., `<X>`, `<Trash2>`).

## 2025-03-16 - title vs aria-label
**Learning:** Found icon-only buttons using `title` attribute for tooltips and screen reader context instead of `aria-label`. The `title` attribute is often inconsistently read or ignored by modern screen readers depending on user settings, leaving icon-only buttons inaccessible.
**Action:** When adding accessible names to icon-only buttons, prioritize `aria-label` for reliable screen reader support, even if a `title` attribute is already present for visual tooltips.