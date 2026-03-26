import express from "express";
import * as invoicingController from "../controllers/invoicingController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/charge-types", checkPermission([PERMISSIONS.MANAGE_BILLING, PERMISSIONS.TAKE_PAYMENT, PERMISSIONS.REPAIR_VIEW]), invoicingController.listChargeTypes);

// Generating and fetching invoices strictly associated with a Repair Order
router.get("/for-repair/:repairId", checkPermission([PERMISSIONS.MANAGE_BILLING, PERMISSIONS.REPAIR_VIEW]), invoicingController.getInvoiceForRepair);
router.post("/for-repair/:repairId", checkPermission(PERMISSIONS.MANAGE_BILLING), invoicingController.generateInvoice);

// Applying payments to an existing invoice
router.post("/:invoiceId/pay", checkPermission([PERMISSIONS.MANAGE_BILLING, PERMISSIONS.TAKE_PAYMENT]), invoicingController.applyPayment);

// Standard Invoice Management CRUD
router.put("/:invoiceId", checkPermission(PERMISSIONS.MANAGE_BILLING), invoicingController.updateInvoice);
router.delete("/:invoiceId", checkPermission(PERMISSIONS.MANAGE_BILLING), invoicingController.deleteInvoice);

// Adding line items to an existing invoice explicitly
router.post("/:invoiceId/add-items", checkPermission([PERMISSIONS.MANAGE_BILLING, PERMISSIONS.TAKE_PAYMENT]), invoicingController.addInvoiceItem);

// Customer-Level Aggregated Billing & Lump Payments
router.get("/customer/:customerId", checkPermission(PERMISSIONS.REPAIR_VIEW), invoicingController.getCustomerLedger);
router.post("/customer/:customerId/pay", checkPermission(PERMISSIONS.TAKE_PAYMENT), invoicingController.applyCustomerLumpSumPayment);

export default router;
