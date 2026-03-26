import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import models from "../models/index.js";
import { ROLES } from "../utils/constants.js";

/**
 * Authenticate JWT tokens and attach the StaffMember (with joined Role and Permissions) to req.user.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // V2: Querying StaffMember instead of legacy User
    const staffMember = await models.StaffMember.findByPk(payload.sub, {
      include: [
        {
          model: models.Role,
          as: "role",
          include: [
            {
              model: models.Permission,
              as: "permissions",
              through: { attributes: [] }, // RolePermission join table
            },
          ],
        },
      ],
    });

    if (!staffMember || !staffMember.isActive) {
      return res
        .status(401)
        .json({ message: "Staff member not found or inactive" });
    }

    // Extract raw permission code strings from the joined User->Role->Permissions array
    const permissions =
      staffMember.role && Array.isArray(staffMember.role.permissions)
        ? staffMember.role.permissions.map((p) => p.code)
        : [];

    req.user = {
      id: staffMember.id,
      name: staffMember.fullName,
      email: staffMember.email,
      roleId: staffMember.roleId,
      roleName: staffMember.role?.name,
      roleCode: staffMember.role?.code,
      permissions,
      // Pass along technician details if applicable
      technicianRank: staffMember.technicianRank,
      isTechnician: staffMember.role?.code === ROLES.TECHNICIAN,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("Auth error", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Require ALL listed permissions. ADMIN (*:*) bypasses.
 */
export const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userPerms = req.user.permissions || [];
    
    // Super admin bypass
    if (req.user.roleCode === 'ADMIN' || userPerms.includes("*:*")) return next();
    
    if (!requiredPermissions.length) {
      return next();
    }
    
    const hasAll = requiredPermissions.every((p) => userPerms.includes(p));
    if (!hasAll) {
      return res.status(403).json({ message: "Forbidden: Missing required permissions" });
    }
    
    next();
  };
};

/**
 * Require ANY of the listed permissions. ADMIN (*:*) bypasses.
 */
export const checkPermission = (required) => {
  const perms = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userPerms = req.user.permissions || [];
    
    // Super admin bypass
    if (req.user.roleCode === 'ADMIN' || userPerms.includes("*:*")) return next();
    
    const hasAny = perms.some((p) => userPerms.includes(p));
    if (!hasAny) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};

/**
 * Role check middleware. Requires one of the given role codes. ADMIN always has access.
 */
export const requireRole = (requiredRoles) => {
  const codes = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userPerms = req.user.permissions || [];
    if (req.user.roleCode === 'ADMIN' || userPerms.includes("*:*")) return next();
    
    const userRoleCode = req.user.roleCode;
    if (!userRoleCode || !codes.includes(userRoleCode)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role access" });
    }
    
    next();
  };
};
