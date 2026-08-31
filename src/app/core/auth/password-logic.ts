/**
 * NEXORA Authentication & Password Security Logic
 * Pure functions, crypto primitives, strength evaluation, and lockout rules.
 * Modeled after real-world salted hash storage and rate-limiting patterns.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60_000;

export const ERR_INCORRECT_PASSWORD = 'ERR_INCORRECT_PASSWORD';
export const ERR_LOCKED_OUT = 'ERR_LOCKED_OUT';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
}

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least one letter (a-z, A-Z)
 * - At least one digit (0-9)
 * Explicit per-rule error strings for inline hints.
 */
export function validatePasswordStrength(pw: string): PasswordValidationResult {
  const errors: string[] = [];
  if (!pw || pw.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  if (!/[a-zA-Z]/.test(pw || '')) {
    errors.push('Password must contain at least one letter');
  }
  if (!/\d/.test(pw || '')) {
    errors.push('Password must contain at least one number');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Returns a 0-3 strength score for UI meter visualization:
 * 0: Invalid or shorter than 8 characters or missing required letter/digit
 * 1: Meets baseline requirements (8+ chars, letter, digit)
 * 2: Good (10+ chars with mixed case or symbols)
 * 3: Strong (12+ chars with mixed case, digits, and symbols)
 */
export function passwordStrengthScore(pw: string): 0 | 1 | 2 | 3 {
  if (!pw || pw.length < PASSWORD_MIN_LENGTH) return 0;
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  if (!hasLetter || !hasDigit) return 0;

  const hasMixedCase = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);

  if (pw.length >= 12 && hasMixedCase && hasSymbol) {
    return 3;
  }
  if (pw.length >= 10 && (hasMixedCase || hasSymbol)) {
    return 2;
  }
  return 1;
}

/**
 * Safe accessor for Web Crypto in browser or Node.js runtimes.
 */
function getWebCrypto(): Crypto | null {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  return null;
}

/**
 * Generates a 16-byte cryptographically secure random salt as a 32-character hex string.
 * Falls back to pseudo-random generation if crypto.getRandomValues is unavailable.
 */
export function generateSalt(): string {
  const webCrypto = getWebCrypto();
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let fallback = '';
  for (let i = 0; i < 32; i++) {
    fallback += Math.floor(Math.random() * 16).toString(16);
  }
  return fallback;
}

/**
 * Hashes password with salt using SHA-256 via Web Crypto API.
 * Feature-checks with clear error if subtle crypto is unavailable.
 */
export async function hashPassword(pw: string, salt: string): Promise<string> {
  const webCrypto = getWebCrypto();
  if (!webCrypto || !webCrypto.subtle) {
    throw new Error('Web Crypto subtle API is not available in the current environment');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + pw);
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a candidate password against an expected salted hash.
 */
export async function verifyPassword(pw: string, salt: string, expectedHash: string): Promise<boolean> {
  try {
    const computed = await hashPassword(pw, salt);
    return computed === expectedHash;
  } catch {
    return false;
  }
}

/**
 * Calculates remaining lockout time in milliseconds from a LockoutState.
 * Returns 0 if not locked out or lock has expired.
 */
export function getLockoutRemainingMs(state: LockoutState | null | undefined, now: number = Date.now()): number {
  if (!state || !state.lockedUntil) return 0;
  return Math.max(0, state.lockedUntil - now);
}
