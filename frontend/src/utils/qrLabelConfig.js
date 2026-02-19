import { api } from "./apiClient.js";

const DEFAULTS = {
  paperWidthMm: 50,
  paperHeightMm: 25,
  qrSizeMm: 20,
  logoSizeMm: 12,
  nameFontSizePt: 6,
};

let cached = null;

/**
 * Fetch QR label dimensions from backend (configurable via .env). Cached per session.
 * @returns {Promise<{ paperWidthMm: number, paperHeightMm: number, qrSizeMm: number, nameFontSizePt: number }>}
 */
export async function getQrLabelConfig() {
  if (cached) return cached;
  try {
    const res = await api.get("/config/label");
    cached = { ...DEFAULTS, ...res.data };
    return cached;
  } catch {
    return DEFAULTS;
  }
}

export const defaultQrLabelConfig = DEFAULTS;
