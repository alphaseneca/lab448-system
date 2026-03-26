import express from "express";
import * as mediaController from "../controllers/mediaController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

// List attachments for a repair
router.get("/repair/:repairId", checkPermission(PERMISSIONS.REPAIR_VIEW), mediaController.listAttachmentsForRepair);

// Upload a new attachment
router.post("/repair/:repairId", checkPermission([PERMISSIONS.REPAIR_CREATE, PERMISSIONS.REPAIR_STATUS_UPDATE]), mediaController.uploadAttachment);

// Delete attachment
router.delete("/:id", checkPermission(PERMISSIONS.REPAIR_EDIT), mediaController.deleteAttachment);

export default router;
