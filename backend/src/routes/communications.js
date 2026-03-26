import express from "express";
import * as communicationsController from "../controllers/communicationsController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

// View templates
router.get("/templates", checkPermission([PERMISSIONS.COMMUNICATIONS_VIEW, PERMISSIONS.REPAIR_VIEW]), communicationsController.listTemplates);
router.post("/templates", checkPermission(PERMISSIONS.COMMUNICATIONS_MANAGE), communicationsController.createTemplate);
router.put("/templates/:id", checkPermission(PERMISSIONS.COMMUNICATIONS_MANAGE), communicationsController.updateTemplate);
router.delete("/templates/:id", checkPermission(PERMISSIONS.COMMUNICATIONS_MANAGE), communicationsController.deleteTemplate);

// View Conversation history
router.get("/history/:customerId", checkPermission([PERMISSIONS.COMMUNICATIONS_VIEW, PERMISSIONS.CUSTOMER_VIEW]), communicationsController.getConversationHistory);

// Send/Log a message
router.post("/log/:customerId", checkPermission(PERMISSIONS.COMMUNICATIONS_SEND), communicationsController.logMessage);

export default router;
