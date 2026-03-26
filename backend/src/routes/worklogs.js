import express from "express";
import * as worklogController from "../controllers/worklogController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// View work logs for a specific repair
router.get("/", checkPermission(PERMISSIONS.REPAIR_VIEW), worklogController.listWorkLogs);

// Create a work log
router.post("/", checkPermission(PERMISSIONS.REPAIR_EDIT), worklogController.logWork);

// Update / Delete specific work logs
router.put("/:logId", checkPermission(PERMISSIONS.REPAIR_EDIT), worklogController.updateWorkLog);
router.delete("/:logId", checkPermission(PERMISSIONS.REPAIR_EDIT), worklogController.deleteWorkLog);

export default router;
