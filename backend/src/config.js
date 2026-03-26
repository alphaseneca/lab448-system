/**
 * Lab448 System Configuration
 *
 * Responsibilities:
 * - Environment variables (dotenv)
 * - Feature flags and business constants
 * - Infrastructure settings (DB URL, JWT Secret)
 *
 * Role of other core files:
 * - server.js: Express app initialization, middleware mounting, and listener.
 * - models/index.js: Sequelize instance creation and model association.
 * - utils/: Pure helper functions (validation, formatting) without side effects.
 */
import dotenv from "dotenv";


dotenv.config();

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export const JWT_EXPIRES_IN = "8h";

export const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/lab448_system_mock";


// ——— SMS (Aakash) ———
// Placeholders: {{customerName}}, {{qrToken}}, {{date}}. Override via SMS_INTAKE_MESSAGE, SMS_REPAIRED_MESSAGE, SMS_UNREPAIRABLE_MESSAGE in .env
export const SMS_MESSAGES = {
  INTAKE:
    process.env.SMS_INTAKE_MESSAGE ||
    "Hi {{customerName}}, your device has been received for repair on {{date}}. ID: {{qrToken}}. We'll update you when it's ready. - Lab448",
  REPAIRED:
    process.env.SMS_REPAIRED_MESSAGE ||
    "Your device repair is complete. ID: {{qrToken}}. Please collect it from our store. - Lab448",
  UNREPAIRABLE:
    process.env.SMS_UNREPAIRABLE_MESSAGE ||
    "We're sorry we couldn't repair your device with ID {{qrToken}}. Please collect it from our store. - Lab448",
};

export function formatSmsMessage(template, data = {}) {
  let out = template;
  for (const [key, value] of Object.entries(data)) {
    out = out.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      value != null ? String(value) : "",
    );
  }
  return out;
}

// ——— Charges ———
export const FRONTDESK_CHARGE = Number(process.env.FRONTDESK_CHARGE) || 100;

// ——— QR label (repair item) ———
// Paper size, QR size, logo size, name font size. Override via .env for thermal/label printers.
export const QR_LABEL = {
  paperWidthMm: Number(process.env.QR_LABEL_PAPER_WIDTH_MM) || 50,
  paperHeightMm: Number(process.env.QR_LABEL_PAPER_HEIGHT_MM) || 25,
  qrSizeMm: Number(process.env.QR_LABEL_QR_SIZE_MM) || 20,
  logoSizeMm: Number(process.env.QR_LABEL_LOGO_SIZE_MM) || 12,
  nameFontSizePt: Number(process.env.QR_LABEL_NAME_FONT_SIZE_PT) || 6,
};

