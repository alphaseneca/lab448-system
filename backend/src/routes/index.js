/**
 * V2 API Router — Lab448 System
 * All domain routes mounted here under /api
 */
import express from "express";

const router = express.Router();

// Domain 1: IAM (Auth, Staff, Roles, Permissions)
import iamRoutes from "./iam.js";
router.use("/auth", iamRoutes);

// Domain 2: Customer
import customerRoutes from "./customer.js";
router.use("/customers", customerRoutes);

// Domain 3: Service Catalog
import serviceCatalogRoutes from "./serviceCatalog.js";
router.use("/service-catalog", serviceCatalogRoutes);

// Domain 4: Repair Workflow
import repairRoutes from "./repairWorkflow.js";
router.use("/repair-orders", repairRoutes);

// Domain 5: Invoicing
import invoiceRoutes from "./invoicing.js";
router.use("/invoicing", invoiceRoutes);

// Domain 6: Inventory
import inventoryRoutes from "./inventory.js";
router.use("/inventory", inventoryRoutes);

// Domain 7: Media Attachments
import mediaRoutes from "./media.js";
router.use("/media", mediaRoutes);

// Domain 8: Communications
import communicationsRoutes from "./communications.js";
router.use("/communications", communicationsRoutes);

// Domain 9: System (Audit)
import systemRoutes from "./system.js";
router.use("/system", systemRoutes);

// Domain 10: Subscriptions
import subscriptionsRoutes from "./subscriptions.js";
router.use("/subscriptions", subscriptionsRoutes);

// Domain 11: Dashboard
import dashboardRoutes from "./dashboard.js";
router.use("/dashboard", dashboardRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Lab448 API is running",
    timestamp: new Date(),
  });
});

export default router;
