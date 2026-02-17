/**
 * Aakash SMS (Nepal) integration - https://sms.aakashsms.com
 * API v3: POST https://sms.aakashsms.com/sms/v3/send
 * Parameters: auth_token, to (comma-separated 10-digit numbers), text
 */

const AAKASH_SMS_URL = "https://sms.aakashsms.com/sms/v3/send";

/**
 * Normalize Nepali mobile number to 10-digit form.
 * Accepts: 98XXXXXXXX, 97XXXXXXXX, or 12-digit 977/9798... forms.
 * @param {string} phone - Raw phone from DB
 * @returns {string|null} - 10-digit number or null if invalid
 */
function normalizePhone(phone) {
  if (phone == null || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  // 10 digits: 98XXXXXXXX or 97XXXXXXXX (Nepal mobile prefixes)
  if (digits.length === 10 && (digits.startsWith("98") || digits.startsWith("97"))) return digits;
  // 12 digits: 97798XXXXXXXX or 9798XXXXXXXX -> last 10 digits
  if (digits.length === 12 && (digits.startsWith("97798") || digits.startsWith("97797"))) {
    return digits.slice(-10);
  }
  return null;
}

/**
 * Send a single SMS via Aakash SMS API (v3).
 * @param {string} to - One or more 10-digit numbers (comma-separated), or single number
 * @param {string} text - Message body
 * @returns {Promise<{ success: boolean; error?: string; response?: object }>}
 */
export async function sendSms(to, text) {
  const authToken = process.env.AAKASH_SMS_AUTH_TOKEN;
  if (!authToken || String(authToken).trim() === "") {
    return { success: false, error: "AAKASH_SMS_AUTH_TOKEN is not set" };
  }

  const normalized = normalizePhone(to);
  if (!normalized) {
    return { success: false, error: "Invalid or missing phone number" };
  }

  try {
    const body = new URLSearchParams({
      auth_token: authToken.trim(),
      to: normalized,
      text: String(text).slice(0, 160), // single SMS length
    });

    const response = await fetch(AAKASH_SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const responseText = await response.text();
    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      // non-JSON response
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `HTTP ${response.status}`,
        response: data,
      };
    }

    if (data && data.error === true) {
      return {
        success: false,
        error: data.message || "API returned error",
        response: data,
      };
    }

    return { success: true, response: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
