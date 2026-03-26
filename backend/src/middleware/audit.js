import models from "../models/index.js";

/**
 * Creates an AuditEvent record (Domain 9)
 */
export const logAudit = async ({
  userId,
  repairOrderId,
  actorType = "STAFF",
  eventName,
  entityType,
  entityId,
  beforeSnapshot = null,
  afterSnapshot = null,
  ipAddress = null,
}, transaction = null) => {
  try {
    await models.AuditEvent.create({
      performedById: userId || null, // null if system action
      actorType,
      eventName,
      entityType,
      entityId,
      repairOrderId: repairOrderId || null,
      beforeSnapshot: beforeSnapshot ? JSON.parse(JSON.stringify(beforeSnapshot)) : null,
      afterSnapshot: afterSnapshot ? JSON.parse(JSON.stringify(afterSnapshot)) : null,
      ipAddress,
    }, { transaction });
  } catch (err) {
    console.error("Failed to write audit event", err);
  }
};
