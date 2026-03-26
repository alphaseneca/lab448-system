import express from "express";
import * as inventoryController from "../controllers/inventoryController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

// View catalog
router.get("/parts", checkPermission([PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.REPAIR_VIEW]), inventoryController.listParts);

// Manage parts catalog
router.post("/parts", checkPermission(PERMISSIONS.INVENTORY_MANAGE), inventoryController.createPart);
router.put("/parts/:id", checkPermission(PERMISSIONS.INVENTORY_MANAGE), inventoryController.updatePart);
router.delete("/parts/:id", checkPermission(PERMISSIONS.INVENTORY_MANAGE), inventoryController.deletePart);

// Receive new stock
router.post("/parts/:id/add-stock", checkPermission(PERMISSIONS.INVENTORY_MANAGE), inventoryController.addStock);

export default router;
