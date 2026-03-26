import express from "express";
import * as serviceCatalogController from "../controllers/serviceCatalogController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

// Need auth
router.use(authenticate);

// View catalog (everyone logged in can typically see services)
router.get("/", serviceCatalogController.listServices);
router.get("/:id", serviceCatalogController.getServiceById);

// Admin / Manage services
router.post("/", checkPermission(PERMISSIONS.SERVICE_CATALOG_MANAGE), serviceCatalogController.createService);
router.put("/:id", checkPermission(PERMISSIONS.SERVICE_CATALOG_MANAGE), serviceCatalogController.updateService);
router.delete("/:id", checkPermission(PERMISSIONS.SERVICE_CATALOG_MANAGE), serviceCatalogController.deleteService);

export default router;
