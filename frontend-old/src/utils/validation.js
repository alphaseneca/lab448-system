/**
 * Phone must be empty or exactly 10 digits (numbers only).
 */
export function validatePhone(value) {
  if (value == null || String(value).trim() === "") return { valid: true };
  const s = String(value).replace(/\s/g, "");
  if (!/^\d{10}$/.test(s)) return { valid: false, message: "Must be 10 digits" };
  return { valid: true };
}

/**
 * Email must be empty or a valid email format.
 */
export function validateEmail(value) {
  if (value == null || String(value).trim() === "") return { valid: true };
  const s = String(value).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(s)) return { valid: false, message: "Enter a valid email" };
  return { valid: true };
}
