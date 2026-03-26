import express from "express";
import * as dashboardController from "../controllers/dashboardController.js";
import { authenticate, checkPermission, requireRole } from "../middleware/auth.js";
import { ROLES, PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// ── Role-specific dashboards ──

// Technician: work stats, assigned repairs, performance trend
router.get("/technician", requireRole([ROLES.TECHNICIAN, ROLES.ADMIN]), dashboardController.technicianDashboard);

// Front Desk: intakes, deliveries, recent repairs
router.get("/front-desk", requireRole([ROLES.FRONT_DESK, ROLES.ADMIN]), dashboardController.frontDeskDashboard);

// Logistics: inventory health, stock movements
router.get("/logistics", requireRole([ROLES.LOGISTICS, ROLES.ADMIN]), dashboardController.logisticsDashboard);

// Finance: collections, revenue, outstanding invoices
router.get("/finance", requireRole([ROLES.FINANCE, ROLES.ADMIN]), dashboardController.financeDashboard);

// Manager: operations overview, staff utilization, bottlenecks
router.get("/manager", requireRole([ROLES.MANAGER, ROLES.ADMIN]), dashboardController.managerDashboard);

// Admin: system overview, roles distribution
router.get("/admin", requireRole([ROLES.ADMIN]), dashboardController.adminDashboard);

// ── General ──

// Summary: quick stats for any authenticated staff with dashboard permission
router.get("/summary", checkPermission(PERMISSIONS.VIEW_DASHBOARD), dashboardController.dashboardSummary);

export default router;
