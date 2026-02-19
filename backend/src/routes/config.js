import { Router } from "express";
import { QR_LABEL } from "../config.js";

const router = Router();

// Public endpoint: QR label dimensions for frontend print layout (no auth)
router.get("/label", (req, res) => {
  res.json(QR_LABEL);
});

export default router;
