import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes cleanly without conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats numeric values to Pakistani Rupees (PKR)
 * Example: 4850 -> "Rs. 4,850"
 */
export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  return `Rs. ${new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

/**
 * Normalizes and validates Pakistani mobile numbers to strict 03XXXXXXXXX format.
 *
 * Accepted input prefixes: +92, 0092, 92 (12-digit), 3XXXXXXXXX (10-digit), 03XXXXXXXXX.
 * After normalization the number must match /^03\d{9}$/ — no operator ranges are
 * hard-coded so new PTA allocations are automatically accepted.
 */
export function normalizePakistaniPhone(phone: string): string | null {
  if (!phone) return null;

  // Strip whitespace, dashes, and parentheses (keep digits and leading plus)
  let cleaned = phone.trim().replace(/[\s\-()+]/g, '');

  // Remove leading '+' if present after stripping
  if (phone.trim().startsWith('+')) {
    cleaned = phone.trim().replace(/[\s\-()+]/g, '');
  } else {
    cleaned = phone.trim().replace(/[\s\-()]/g, '');
  }

  // Normalise international prefixes → leading zero
  if (cleaned.startsWith('+92')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0092')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('92') && cleaned.length === 12) {
    // 92XXXXXXXXXX  (12 digits, no leading zero)
    cleaned = '0' + cleaned.slice(2);
  } else if (/^3\d{9}$/.test(cleaned)) {
    // 3XXXXXXXXX  (10 digits, missing leading zero)
    cleaned = '0' + cleaned;
  }

  // Broad Pakistani mobile regex: 03 followed by exactly 9 more digits.
  // Deliberately avoids hard-coding operator ranges so new PTA allocations work.
  if (!/^03\d{9}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validates standard Pakistani mobile numbers
 */
export function isValidPakistaniPhone(phone: string): boolean {
  return normalizePakistaniPhone(phone) !== null;
}

/**
 * Formats a Pakistani phone number into clean presentation: 0300 1234567
 */
export function formatPakistaniPhone(phone: string): string {
  const normalized = normalizePakistaniPhone(phone);
  if (!normalized) return phone;
  return `${normalized.slice(0, 4)} ${normalized.slice(4)}`;
}

/**
 * Generate URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
