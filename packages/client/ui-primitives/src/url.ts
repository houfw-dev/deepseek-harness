// URL helpers for external links rendered in panels. Stored rows (hot videos,
// source links) are often authored without a scheme ("bilibili.com/video/…");
// used directly as an anchor href the browser resolves such a value as a
// relative path against the app origin, so target="_blank" navigates to a
// dead in-app path instead of opening the external site.

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i

/**
 * Normalize a stored external URL for an anchor href: prepend `https://` when
 * the value has no scheme, leaving absolute (`https://…`, `mailto:…`) and
 * protocol-relative (`//host/…`) values untouched.
 * @param raw - the stored URL, possibly scheme-less.
 * @returns an absolute URL safe for `href` + `target="_blank"`.
 */
export function normalizeExternalUrl(raw: string): string {
  const value = raw.trim()
  if (value === '') return value
  if (SCHEME_PATTERN.test(value) || value.startsWith('//')) return value
  return `https://${value}`
}
