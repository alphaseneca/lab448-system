/**
 * Client-side phone and email validators.
 * Mirrors validation rules used in frontend-old.
 */

/**
 * Validates a phone number. Accepts 10-digit numbers (Nepal/India format).
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePhone(value) {
  if (!value || String(value).trim() === '') {
    return { valid: false, message: 'Phone number is required.' };
  }
  const cleaned = String(value).replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return { valid: false, message: 'Phone number must be exactly 10 digits.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates an email address. Empty string is allowed (email is optional).
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(value) {
  if (!value || String(value).trim() === '') {
    return { valid: true, message: '' }; // email is optional
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(value).trim())) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true, message: '' };
}
