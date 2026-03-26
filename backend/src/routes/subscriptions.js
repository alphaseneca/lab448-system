import express from "express";
import * as subscriptionsController from "../controllers/subscriptionsController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

// List active plans
router.get("/plans", checkPermission([PERMISSIONS.SUBSCRIPTION_VIEW, PERMISSIONS.CUSTOMER_VIEW]), subscriptionsController.listPlans);

// Customer specific subscriptions
router.get("/customer/:customerId", checkPermission([PERMISSIONS.SUBSCRIPTION_VIEW, PERMISSIONS.CUSTOMER_VIEW]), subscriptionsController.getCustomerSubscriptions);
router.post("/customer/:customerId", checkPermission(PERMISSIONS.SUBSCRIPTION_MANAGE), subscriptionsController.subscribeCustomer);

// Updating and Cancelling individual subscriptions
router.put("/:subscriptionId", checkPermission(PERMISSIONS.SUBSCRIPTION_MANAGE), subscriptionsController.updateCustomerSubscription);
router.delete("/:subscriptionId", checkPermission(PERMISSIONS.SUBSCRIPTION_MANAGE), subscriptionsController.cancelCustomerSubscription);

export default router;
