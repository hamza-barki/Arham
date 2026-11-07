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

  // Extract all digits
  let digits = phone.replace(/\D/g, '');

  // Strip international prefix (0092 or 92)
  if (digits.startsWith('0092')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('92')) {
    digits = digits.slice(2);
  }

  // Strip leading 0 if present to get raw 10-digit mobile number
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Pakistani mobile numbers must start with 3 and have 10 digits in total (3XXXXXXXXX)
  if (/^3\d{9}$/.test(digits)) {
    return '0' + digits;
  }

  return null;
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
