import express from "express";
import * as repairController from "../controllers/repairOrderController.js";
import { authenticate, checkPermission, requireRole } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

import worklogsRouter from "./worklogs.js";

// Listing & Fetching
router.get("/", checkPermission(PERMISSIONS.REPAIR_VIEW), repairController.listRepairOrders);
router.get("/:id", checkPermission(PERMISSIONS.REPAIR_VIEW), repairController.getRepairById);
router.get("/by-qr/:token", checkPermission(PERMISSIONS.REPAIR_VIEW), repairController.getRepairByToken);

// Creation
router.post("/", checkPermission(PERMISSIONS.REPAIR_CREATE), repairController.createRepairOrder);

// Tech / Status Management
router.post("/:id/transition", checkPermission(PERMISSIONS.REPAIR_STATUS_UPDATE), repairController.transitionRepairStatus);
router.put("/:id", checkPermission(PERMISSIONS.REPAIR_EDIT), repairController.updateRepairOrder);
router.delete("/:id", checkPermission(PERMISSIONS.REPAIR_DELETE), repairController.deleteRepairOrder);

// Nested Work Logs API
router.use("/:id/worklogs", worklogsRouter);

export default router;
