/**
 * Seed roles with code and permissions. Run after db:sync.
 * Usage: node src/scripts/seed-roles.js
 */
import { Op } from "sequelize";
import db from "../models/index.js"; // DB object exported differently in V2
import { ROLES, PERMISSIONS } from "../utils/constants.js";

const SYSTEM_ROLES_CONFIG = [
  {
    id: "role_tech",
    code: ROLES.TECHNICIAN,
    name: "Repair Army",
    description: "Performs repairs and updates job status",
    permissions: [
      PERMISSIONS.REPAIR_VIEW,
      PERMISSIONS.REPAIR_STATUS_UPDATE,
      PERMISSIONS.REPAIR_EDIT,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
  },
  {
    id: "role_fd",
    code: ROLES.FRONT_DESK,
    name: "Front Desk",
    description: "Customer intake, job creation, coordination",
    permissions: [
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_EDIT,
      PERMISSIONS.REPAIR_CREATE,
      PERMISSIONS.REPAIR_VIEW,
      PERMISSIONS.REPAIR_STATUS_UPDATE,
      PERMISSIONS.MANAGE_BILLING,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
  },
  {
    id: "role_log",
    code: ROLES.LOGISTICS,
    name: "Logistics Crew",
    description: "Inventory management and parts handling",
    permissions: [
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.REPAIR_VIEW,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
  },
  {
    id: "role_fin",
    code: ROLES.FINANCE,
    name: "Finance Desk",
    description: "Payments, reconciliation, refunds",
    permissions: [
      PERMISSIONS.MANAGE_BILLING,
      PERMISSIONS.REPAIR_VIEW,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
  },
  {
    id: "role_mgr",
    code: ROLES.MANAGER,
    name: "Operations Command",
    description: "Oversees operations and approvals",
    permissions: [
      PERMISSIONS.REPAIR_VIEW,
      PERMISSIONS.MANAGE_STAFF,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
  },
  {
    id: "role_admin",
    code: ROLES.ADMIN,
    name: "HQ Access",
    description: "Full system access and configuration",
    permissions: ["*:*"],
  },
];

async function seedRoles() {
  try {
    console.log("Seeding roles...");
    for (const role of SYSTEM_ROLES_CONFIG) {
      const existing = await db.Role.findOne({
        where: { [Op.or]: [{ code: role.code }, { id: role.id }] },
      });
      if (existing) {
        await existing.update({
          code: role.code,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        });
        console.log(`  - Updated ${role.code}: ${role.name}`);
      } else {
        await db.Role.create({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        });
        console.log(`  - Created ${role.code}: ${role.name}`);
      }
    }
    console.log("✓ Roles seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  }
}

seedRoles();
