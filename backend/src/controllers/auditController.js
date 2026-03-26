import models from "../models/index.js";

// =====================================
// System (Audit Logs) API
// =====================================

export const listAuditEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const where = {};
    if (req.query.repairOrderId) where.repairOrderId = req.query.repairOrderId;
    if (req.query.entityType) where.entityType = req.query.entityType;
    if (req.query.performedById) where.performedById = req.query.performedById;

    const events = await models.AuditEvent.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [{ model: models.StaffMember, as: "performedBy", attributes: ["id", "fullName", "email"] }]
    });

    res.json({
        total: events.count,
        data: events.rows
    });
  } catch (err) {
    console.error("List audit events error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
