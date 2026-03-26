import express from "express";
import * as auditController from "../controllers/auditController.js";
import * as systemController from "../controllers/systemController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

// Configuration
router.get("/config/label", systemController.getLabelConfig);

// Only Admins or highest level managers should be viewing raw audit logs
router.get("/audit", requireRole([ROLES.ADMIN]), auditController.listAuditEvents);

export default router;
