/**
 * Return-URL sanitizer — open-redirect prevention for guard and login flows.
 *
 * A return URL is only trusted when it is a relative, same-origin path:
 * - must start with a single '/'
 * - must not start with '//' (protocol-relative)
 * - must contain no URL scheme (a ':' appearing before any '/')
 * - must contain no backslashes (browsers treat '\' like '/', so '/\evil.com'
 *   can behave like a protocol-relative URL)
 * Anything else falls back to '/catalog'.
 */
const FALLBACK_RETURN_URL = '/catalog';

export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url) {
    return FALLBACK_RETURN_URL;
  }
  if (!url.startsWith('/')) {
    return FALLBACK_RETURN_URL;
  }
  if (url.startsWith('//')) {
    return FALLBACK_RETURN_URL;
  }
  if (url.includes('\\')) {
    return FALLBACK_RETURN_URL;
  }
  const colonIndex = url.indexOf(':');
  const slashIndex = url.indexOf('/');
  if (colonIndex !== -1 && (slashIndex === -1 || colonIndex < slashIndex)) {
    return FALLBACK_RETURN_URL;
  }
  // Prevent redirect loops back to auth pages
  if (url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/forgot-password')) {
    return FALLBACK_RETURN_URL;
  }
  return url;
}

