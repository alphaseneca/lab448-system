/**
 * Frontend constants — kept in 1:1 sync with backend/src/utils/constants.js
 * Do NOT use ad-hoc strings for roles, permissions, or statuses anywhere in the app.
 */

// ─── Roles ────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  FRONT_DESK: 'FRONT_DESK',
  LOGISTICS: 'LOGISTICS',
  FINANCE: 'FINANCE',
  MANAGER: 'MANAGER',
};

// ─── Permissions (exact strings the backend checks) ───────
export const PERMISSIONS = {
  // IAM
  MANAGE_STAFF: 'manage:staff',
  // Customer
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_EDIT: 'customer:edit',
  CUSTOMER_DELETE: 'customer:delete',
  // Repairs & Workflow
  REPAIR_VIEW: 'repair:view',
  REPAIR_CREATE: 'repair:create',
  REPAIR_EDIT: 'repair:edit',
  REPAIR_DELETE: 'repair:delete',
  REPAIR_STATUS_UPDATE: 'repair:update_status',
  // Service Catalog
  SERVICE_CATALOG_MANAGE: 'service_catalog:manage',
  // Billing & Invoicing  (no separate "take_payment" — billing:manage covers both)
  MANAGE_BILLING: 'billing:manage',
  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  // Communications
  COMMUNICATIONS_VIEW: 'communications:view',
  COMMUNICATIONS_MANAGE: 'communications:manage',
  COMMUNICATIONS_SEND: 'communications:send',
  // Subscriptions
  SUBSCRIPTION_VIEW: 'subscription:view',
  SUBSCRIPTION_MANAGE: 'subscription:manage',
  // System
  VIEW_DASHBOARD: 'view:dashboard',
  SYSTEM_MANAGE: 'system:manage',
};

// ─── Repair Statuses ──────────────────────────────────────
export const REPAIR_STATUSES = {
  PENDING: 'PENDING',
  IN_DIAGNOSTICS: 'IN_DIAGNOSTICS',
  WAITING_FOR_PARTS: 'WAITING_FOR_PARTS',
  WAITING_ON_CUSTOMER: 'WAITING_ON_CUSTOMER',
  APPROVED: 'APPROVED',
  IN_REPAIR: 'IN_REPAIR',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const REPAIR_STATUS_LABELS = {
  PENDING: 'Waiting in Queue',
  IN_DIAGNOSTICS: 'In Diagnostics',
  WAITING_FOR_PARTS: 'Waiting for Parts',
  WAITING_ON_CUSTOMER: 'Awaiting Customer Approval',
  APPROVED: 'Approved',
  IN_REPAIR: 'In Repair',
  QUALITY_CONTROL: 'Quality Control',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ALLOWED_STATUS_TRANSITIONS = {
  [REPAIR_STATUSES.PENDING]: [REPAIR_STATUSES.IN_DIAGNOSTICS, REPAIR_STATUSES.CANCELLED],
  [REPAIR_STATUSES.IN_DIAGNOSTICS]: [REPAIR_STATUSES.WAITING_FOR_PARTS, REPAIR_STATUSES.APPROVED, REPAIR_STATUSES.WAITING_ON_CUSTOMER, REPAIR_STATUSES.CANCELLED],
  [REPAIR_STATUSES.WAITING_FOR_PARTS]: [REPAIR_STATUSES.APPROVED, REPAIR_STATUSES.CANCELLED],
  [REPAIR_STATUSES.WAITING_ON_CUSTOMER]: [REPAIR_STATUSES.APPROVED, REPAIR_STATUSES.CANCELLED],
  [REPAIR_STATUSES.APPROVED]: [REPAIR_STATUSES.IN_REPAIR],
  [REPAIR_STATUSES.IN_REPAIR]: [REPAIR_STATUSES.QUALITY_CONTROL, REPAIR_STATUSES.WAITING_FOR_PARTS],
  [REPAIR_STATUSES.QUALITY_CONTROL]: [REPAIR_STATUSES.READY_FOR_DELIVERY, REPAIR_STATUSES.IN_REPAIR],
  [REPAIR_STATUSES.READY_FOR_DELIVERY]: [REPAIR_STATUSES.DELIVERED],
  [REPAIR_STATUSES.DELIVERED]: [],
  [REPAIR_STATUSES.CANCELLED]: [REPAIR_STATUSES.DELIVERED],
};

// ─── Repair Priorities ────────────────────────────────────
export const REPAIR_PRIORITIES = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

// ─── Repair & Device Locations ────────────────────────────
export const REPAIR_LOCATIONS = {
  SHOP: 'SHOP',
  ON_SITE: 'ON_SITE',
};

export const DEVICE_LOCATIONS = {
  AT_CUSTOMER: 'AT_CUSTOMER',
  IN_TRANSIT_TO_SHOP: 'IN_TRANSIT_TO_SHOP',
  AT_SHOP: 'AT_SHOP',
  IN_TRANSIT_TO_CUSTOMER: 'IN_TRANSIT_TO_CUSTOMER',
  DELIVERED: 'DELIVERED',
};

// ─── Intake Sources ───────────────────────────────────────
export const INTAKE_SOURCES = {
  WALK_IN: 'WALK_IN',
  WEBSITE: 'WEBSITE',
  WHATSAPP: 'WHATSAPP',
  PHONE: 'PHONE',
};

export const INTAKE_SOURCE_LABELS = {
  WALK_IN: 'Walk In',
  WEBSITE: 'Website',
  WHATSAPP: 'WhatsApp',
  PHONE: 'Phone',
};

// ─── Invoice ──────────────────────────────────────────────
export const INVOICE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  VOID: 'VOID',
};

export const INVOICE_TYPES = {
  REPAIR: 'REPAIR',
  SUBSCRIPTION_FEE: 'SUBSCRIPTION_FEE',
};

// ─── Payment Methods ──────────────────────────────────────
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  QR_CODE: 'QR_CODE',
  DYNAMIC_QR: 'DYNAMIC_QR',
};

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card / POS',
  BANK_TRANSFER: 'Bank Transfer',
  QR_CODE: 'QR Payment',
  DYNAMIC_QR: 'Dynamic QR',
};

// ─── Technician ───────────────────────────────────────────
export const TECHNICIAN_RANKS = {
  JUNIOR: 'JUNIOR',
  SENIOR: 'SENIOR',
  EXPERT: 'EXPERT',
  MASTER: 'MASTER',
};

export const TECHNICIAN_RANK_LABELS = {
  JUNIOR: 'Repair Soldier',
  SENIOR: 'Repair Sergeant',
  EXPERT: 'Repair Commander',
  MASTER: 'Repair General',
};
