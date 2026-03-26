/**
 * Domain 9 — System
 * General system configurations and health checks
 */
import { QR_LABEL } from "../config.js";

// =====================================
// GET /api/system/config/label
// Public config: QR label dimensions 
// Integrated from legacy routes/config.js
// =====================================
export const getLabelConfig = (req, res) => {
  if (QR_LABEL) {
    return res.json(QR_LABEL);
  }
  res.json({ message: "No QR label configuration set" });
};
