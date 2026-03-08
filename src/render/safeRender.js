/**
 * Escaping helpers for rendering user/content-derived values safely into HTML strings.
 * These helpers are intentionally tiny so templates can stay readable while avoiding XSS.
 */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

export function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
