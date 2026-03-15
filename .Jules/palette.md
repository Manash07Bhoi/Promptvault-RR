## 2025-01-28 - ARIA Labels for Icon Buttons
**Learning:** Found multiple icon-only buttons (like clear search, remove item) without accessible names. Screen readers would just say "button" with no context.
**Action:** Always verify `aria-label` is present on `<button>` elements that only contain an icon (e.g., `<X>`, `<Trash2>`).
