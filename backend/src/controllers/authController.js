/**
 * Domain 1 — IAM (Identity & Access Management)
 * Auth, Staff CRUD, Roles, Permissions
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { ROLES } from "../utils/constants.js";

// Utility function to generate a JWT for a staff member
const generateToken = (staff) => {
  return jwt.sign(
    {
      sub: staff.id,
      email: staff.email,
      role: staff.role?.code,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const staff = await models.StaffMember.findOne({
      where: { email },
      include: [
        {
          model: models.Role,
          as: "role",
          include: [
            {
              model: models.Permission,
              as: "permissions",
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!staff || !staff.isActive) {
      return res.status(401).json({ message: "Invalid credentials or inactive account" });
    }

    const isValid = await bcrypt.compare(password, staff.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Refresh lastLoginAt timestamp behind the scenes
    await staff.update({ lastLoginAt: new Date() }, { silent: true });

    const token = generateToken(staff);
    const permissions =
      staff.role && Array.isArray(staff.role.permissions)
        ? staff.role.permissions.map((p) => p.code)
        : [];

    await logAudit({
      userId: staff.id,
      actorType: "STAFF",
      eventName: "STAFF_LOGIN",
      entityType: "StaffMember",
      entityId: staff.id,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: staff.id,
        name: staff.fullName,
        email: staff.email,
        roleId: staff.roleId,
        roleName: staff.role?.name,
        roleCode: staff.role?.code,
        permissions,
        technicianRank: staff.technicianRank,
      },
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  // Uses the authenticated user object from auth.js middleware
  try {
    const staff = await models.StaffMember.findByPk(req.user.id, {
      include: [
        {
          model: models.Role,
          as: "role",
          include: [
            {
              model: models.Permission,
              as: "permissions",
              through: { attributes: [] },
            },
          ],
        },
      ],
      attributes: { exclude: ["passwordHash"] },
    });

    if (!staff || !staff.isActive) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    
    res.json(staff);
  } catch (err) {
    console.error("GetMe error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===================
// CRUD for Staff 
// ===================
export const createStaff = async (req, res) => {
  const {
    email,
    password,
    fullName,
    phone,
    roleId,
    technicianRank,
  } = req.body;

  if (!email || !password || !fullName || !roleId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const role = await models.Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const staff = await models.StaffMember.create({
      email,
      passwordHash,
      fullName,
      phone,
      roleId,
      technicianRank,
      isActive: true, // Default to true
    });

    const staffData = staff.toJSON();
    delete staffData.passwordHash;

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "STAFF_CREATED",
      entityType: "StaffMember",
      entityId: staff.id,
      afterSnapshot: staffData,
    });

    res.status(201).json(staffData);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Create staff error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listStaff = async (req, res) => {
  try {
    const staffList = await models.StaffMember.findAll({
      attributes: { exclude: ["passwordHash"] },
      include: [{ model: models.Role, as: "role", attributes: ["name", "code"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(staffList);
  } catch (err) {
    console.error("Error listing staff:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const staff = await models.StaffMember.findByPk(req.params.id, {
      attributes: { exclude: ["passwordHash"] },
      include: [{ model: models.Role, as: "role", attributes: ["name", "code"] }],
    });
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json(staff);
  } catch (err) {
    console.error("Get staff by ID error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const staff = await models.StaffMember.findByPk(req.params.id, {
      include: [{ model: models.Role, as: "role" }]
    });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const { email, fullName, phone, roleId, technicianRank, isActive, lastKnownLat, lastKnownLng } = req.body;
    
    // SAFETY: Prevent lockout. If demoting or deactivating an ADMIN, ensure another active ADMIN exists.
    if (staff.role?.code === ROLES.ADMIN) {
      if (isActive === false || (roleId && roleId !== staff.roleId)) {
        const adminCount = await models.StaffMember.count({
          where: { roleId: staff.roleId, isActive: true, deletedAt: null }
        });
        if (adminCount <= 1) {
          return res.status(403).json({ message: "Cannot deactivate or demote the last active Administrator" });
        }
      }
    }

    const beforeSnapshot = staff.toJSON();
    delete beforeSnapshot.passwordHash;

    if (roleId) {
      const role = await models.Role.findByPk(roleId);
      if (!role) return res.status(400).json({ message: "Invalid role specified" });
    }

    await staff.update({
      email: email !== undefined ? email : staff.email,
      fullName: fullName !== undefined ? fullName : staff.fullName,
      phone: phone !== undefined ? phone : staff.phone,
      roleId: roleId !== undefined ? roleId : staff.roleId,
      technicianRank: technicianRank !== undefined ? technicianRank : staff.technicianRank,
      isActive: isActive !== undefined ? isActive : staff.isActive,
      lastKnownLat: lastKnownLat !== undefined ? lastKnownLat : staff.lastKnownLat,
      lastKnownLng: lastKnownLng !== undefined ? lastKnownLng : staff.lastKnownLng,
      lastLocationAt: (lastKnownLat !== undefined || lastKnownLng !== undefined) ? new Date() : staff.lastLocationAt
    });

    const afterSnapshot = staff.toJSON();
    delete afterSnapshot.passwordHash;

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "STAFF_UPDATED",
      entityType: "StaffMember",
      entityId: staff.id,
      beforeSnapshot,
      afterSnapshot,
      ipAddress: req.ip,
    });

    res.json(afterSnapshot);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Update staff error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const staff = await models.StaffMember.findByPk(req.params.id, {
      include: [{ model: models.Role, as: "role" }]
    });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // SAFETY: Prevent lockout. Ensure at least one other active ADMIN exists before deleting.
    if (staff.role?.code === ROLES.ADMIN) {
      const adminCount = await models.StaffMember.count({
        where: { roleId: staff.roleId, isActive: true, deletedAt: null }
      });
      if (adminCount <= 1) {
        return res.status(403).json({ message: "Cannot delete the last active Administrator" });
      }
    }

    // Soft delete to preserve invoice/repair order assignment cascades
    await staff.update({ isActive: false, deletedAt: new Date() });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "STAFF_DELETED",
      entityType: "StaffMember",
      entityId: staff.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Staff member access revoked and account soft-deleted" });
  } catch (err) {
    console.error("Delete staff error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===================
// CRUD for Roles and Permissions
// ===================

export const listRoles = async (req, res) => {
  try {
    const roles = await models.Role.findAll({
      include: [{ model: models.Permission, as: "permissions", through: { attributes: [] } }],
      order: [["name", "ASC"]],
    });
    res.json(roles);
  } catch (err) {
    console.error("List roles error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createRole = async (req, res) => {
  const { name, code, description, permissionCodes } = req.body;
  if (!name || !code) return res.status(400).json({ message: "Name and code are required" });

  const t = await models.sequelize.transaction();
  try {
    const role = await models.Role.create({ name, code, description }, { transaction: t });

    if (permissionCodes && permissionCodes.length > 0) {
      const permissions = await models.Permission.findAll({ where: { code: permissionCodes }, transaction: t });
      await role.addPermissions(permissions, { transaction: t });
    }

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "ROLE_CREATED",
      entityType: "Role",
      entityId: role.id,
      afterSnapshot: { name, code, description, permissionCodes },
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.status(201).json(role);
  } catch (err) {
    await t.rollback();
    console.error("Create role error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRole = async (req, res) => {
  const { name, description, permissionCodes } = req.body;
  
  const t = await models.sequelize.transaction();
  try {
    const role = await models.Role.findByPk(req.params.id, { transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(404).json({ message: "Role not found" });
    }

    await role.update({
      name: name !== undefined ? name : role.name,
      description: description !== undefined ? description : role.description
    }, { transaction: t });

    if (permissionCodes !== undefined) {
      const permissions = await models.Permission.findAll({ where: { code: permissionCodes }, transaction: t });
      await role.setPermissions(permissions, { transaction: t });
    }

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "ROLE_UPDATED",
      entityType: "Role",
      entityId: role.id,
      afterSnapshot: { name: role.name, description: role.description, permissionCodes },
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.json(role);
  } catch (err) {
    await t.rollback();
    console.error("Update role error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listPermissions = async (req, res) => {
  try {
    const permissions = await models.Permission.findAll({ 
      order: [["module", "ASC"], ["code", "ASC"]] 
    });
    res.json(permissions);
  } catch (err) {
    console.error("List permissions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
