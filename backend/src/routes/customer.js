import express from "express";
import * as customerController from "../controllers/customerController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

// All customer routes require authentication
router.use(authenticate);

// List and get
router.get("/", checkPermission([PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.REPAIR_VIEW]), customerController.listCustomers);
router.get("/:id", checkPermission([PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.REPAIR_VIEW]), customerController.getCustomerById);

// Create, update, and delete clients
router.post("/", checkPermission([PERMISSIONS.CUSTOMER_EDIT, PERMISSIONS.REPAIR_CREATE]), customerController.createCustomer);
router.put("/:id", checkPermission([PERMISSIONS.CUSTOMER_EDIT]), customerController.updateCustomer);
router.delete("/:id", checkPermission([PERMISSIONS.CUSTOMER_DELETE]), customerController.deleteCustomer);

// Manage customer addresses
router.post("/:customerId/addresses", checkPermission([PERMISSIONS.CUSTOMER_EDIT]), customerController.addCustomerAddress);
router.put("/:customerId/addresses/:addressId", checkPermission([PERMISSIONS.CUSTOMER_EDIT]), customerController.updateCustomerAddress);
router.delete("/:customerId/addresses/:addressId", checkPermission([PERMISSIONS.CUSTOMER_EDIT]), customerController.deleteCustomerAddress);

// Manage their devices
router.post("/:customerId/devices", checkPermission([PERMISSIONS.CUSTOMER_EDIT, PERMISSIONS.REPAIR_CREATE]), customerController.addCustomerDevice);
router.put("/:customerId/devices/:deviceId", checkPermission([PERMISSIONS.CUSTOMER_EDIT]), customerController.updateCustomerDevice);
router.delete("/:customerId/devices/:deviceId", checkPermission([PERMISSIONS.CUSTOMER_EDIT]), customerController.deleteCustomerDevice);

export default router;
