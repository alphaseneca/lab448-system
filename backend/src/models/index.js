import { Sequelize } from "sequelize";
import { DATABASE_URL } from "../config.js";

// Create Sequelize instance
export const sequelize = new Sequelize(DATABASE_URL, {

  dialect: "postgres",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Import models
// Domain 1: IAM
import Role from "./iam/Role.js";
import Permission from "./iam/Permission.js";
import RolePermission from "./iam/RolePermission.js";
import StaffMember from "./iam/StaffMember.js";

// Domain 2: Customer
import Customer from "./customer/Customer.js";
import CustomerAddress from "./customer/CustomerAddress.js";
import CustomerAuth from "./customer/CustomerAuth.js";
import RepairDeviceType from "./customer/RepairDeviceType.js";
import CustomerDevice from "./customer/CustomerDevice.js";

// Domain 3: Service Catalog
import RepairServiceType from "./service_catalog/RepairServiceType.js";

// Domain 4: Repair Workflow
import RepairOrder from "./repair_workflow/RepairOrder.js";
import RepairStatusLog from "./repair_workflow/RepairStatusLog.js";
import TechnicianWorkLog from "./repair_workflow/TechnicianWorkLog.js";

// Domain 5: Invoicing
import Invoice from "./invoicing/Invoice.js";
import ChargeType from "./invoicing/ChargeType.js";
import InvoiceItem from "./invoicing/InvoiceItem.js";
import Payment from "./invoicing/Payment.js";

// Domain 6: Inventory
import Supplier from "./inventory/Supplier.js";
import PartLocation from "./inventory/PartLocation.js";
import RepairPartCatalog from "./inventory/RepairPartCatalog.js";
import RepairPartUsed from "./inventory/RepairPartUsed.js";
import StockMovement from "./inventory/StockMovement.js";
import PurchaseOrder from "./inventory/PurchaseOrder.js";
import PurchaseOrderItem from "./inventory/PurchaseOrderItem.js";

// Domain 7: Media Attachments
import MediaAttachment from "./media_attachments/MediaAttachment.js";

// Domain 8: Communications
import MessageTemplate from "./communications/MessageTemplate.js";
import WhatsappConversation from "./communications/WhatsappConversation.js";
import CommunicationLog from "./communications/CommunicationLog.js";

// Domain 9: System
import RefCounter from "./system/RefCounter.js";
import AuditEvent from "./system/AuditEvent.js";

// Domain 10: Subscriptions
import SubscriptionPlan from "./subscriptions/SubscriptionPlan.js";
import CustomerSubscription from "./subscriptions/CustomerSubscription.js";
import SubscriptionVisitLog from "./subscriptions/SubscriptionVisitLog.js";
import SubscriptionVisitStaff from "./subscriptions/SubscriptionVisitStaff.js";
import SubscriptionVisitFinding from "./subscriptions/SubscriptionVisitFinding.js";


// Initialize models
const models = {
  Role: Role(sequelize),
  Permission: Permission(sequelize),
  RolePermission: RolePermission(sequelize),
  StaffMember: StaffMember(sequelize),

  Customer: Customer(sequelize),
  CustomerAddress: CustomerAddress(sequelize),
  CustomerAuth: CustomerAuth(sequelize),
  RepairDeviceType: RepairDeviceType(sequelize),
  CustomerDevice: CustomerDevice(sequelize),

  RepairServiceType: RepairServiceType(sequelize),

  RepairOrder: RepairOrder(sequelize),
  RepairStatusLog: RepairStatusLog(sequelize),
  TechnicianWorkLog: TechnicianWorkLog(sequelize),

  Invoice: Invoice(sequelize),
  ChargeType: ChargeType(sequelize),
  InvoiceItem: InvoiceItem(sequelize),
  Payment: Payment(sequelize),

  Supplier: Supplier(sequelize),
  PartLocation: PartLocation(sequelize),
  RepairPartCatalog: RepairPartCatalog(sequelize),
  RepairPartUsed: RepairPartUsed(sequelize),
  StockMovement: StockMovement(sequelize),
  PurchaseOrder: PurchaseOrder(sequelize),
  PurchaseOrderItem: PurchaseOrderItem(sequelize),

  MediaAttachment: MediaAttachment(sequelize),

  MessageTemplate: MessageTemplate(sequelize),
  WhatsappConversation: WhatsappConversation(sequelize),
  CommunicationLog: CommunicationLog(sequelize),

  RefCounter: RefCounter(sequelize),
  AuditEvent: AuditEvent(sequelize),

  SubscriptionPlan: SubscriptionPlan(sequelize),
  CustomerSubscription: CustomerSubscription(sequelize),
  SubscriptionVisitLog: SubscriptionVisitLog(sequelize),
  SubscriptionVisitStaff: SubscriptionVisitStaff(sequelize),
  SubscriptionVisitFinding: SubscriptionVisitFinding(sequelize),
};

// Define associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export default models;
