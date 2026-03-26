import express from "express";
import * as authController from "../controllers/authController.js";
import { authenticate, checkPermission, requireRole } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

// Public routes
router.post("/login", authController.login);

// Protected routes
router.use(authenticate);
router.get("/me", authController.getMe);

// Management Routes: Staff
router.post("/staff", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.createStaff);
router.get("/staff", checkPermission([PERMISSIONS.MANAGE_STAFF, PERMISSIONS.REPAIR_VIEW]), authController.listStaff);
router.get("/staff/:id", checkPermission([PERMISSIONS.MANAGE_STAFF, PERMISSIONS.REPAIR_VIEW]), authController.getStaffById);
router.put("/staff/:id", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.updateStaff);
router.delete("/staff/:id", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.deleteStaff);

// Management Routes: Roles & Permissions
router.get("/roles", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.listRoles);
router.post("/roles", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.createRole);
router.put("/roles/:id", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.updateRole);

router.get("/permissions", checkPermission(PERMISSIONS.MANAGE_STAFF), authController.listPermissions);

export default router;
