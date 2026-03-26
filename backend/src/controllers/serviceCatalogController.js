import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";

// =====================================
// Service Catalog API (Repair Service Types)
// =====================================

export const listServices = async (req, res) => {
  try {
    const services = await models.RepairServiceType.findAll({
      order: [["category", "ASC"], ["name", "ASC"]],
    });
    res.json(services);
  } catch (err) {
    console.error("List services error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const service = await models.RepairServiceType.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service type not found" });
    }
    res.json(service);
  } catch (err) {
    console.error("Get service by ID error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createService = async (req, res) => {
  const { name, parentId, depth, defaultServiceCharge, estimatedDurationMinutes } = req.body;

  if (!name || depth === undefined) {
    return res.status(400).json({ message: "Name and depth are required" });
  }

  try {
    const service = await models.RepairServiceType.create({
      name,
      parentId: parentId || null,
      depth,
      defaultServiceCharge: defaultServiceCharge || 0,
      estimatedDurationMinutes: estimatedDurationMinutes || null,
      isActive: true, // Default
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "SERVICE_CREATED",
      entityType: "RepairServiceType",
      entityId: service.id,
      afterSnapshot: service.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json(service);
  } catch (err) {
    console.error("Create service error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await models.RepairServiceType.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service type not found" });
    }

    const beforeSnapshot = service.toJSON();
    const { name, parentId, depth, defaultServiceCharge, estimatedDurationMinutes, isActive } = req.body;

    await service.update({
      name: name !== undefined ? name : service.name,
      parentId: parentId !== undefined ? parentId : service.parentId,
      depth: depth !== undefined ? depth : service.depth,
      defaultServiceCharge: defaultServiceCharge !== undefined ? defaultServiceCharge : service.defaultServiceCharge,
      estimatedDurationMinutes: estimatedDurationMinutes !== undefined ? estimatedDurationMinutes : service.estimatedDurationMinutes,
      isActive: isActive !== undefined ? isActive : service.isActive,
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "SERVICE_UPDATED",
      entityType: "RepairServiceType",
      entityId: service.id,
      beforeSnapshot,
      afterSnapshot: service.toJSON(),
      ipAddress: req.ip,
    });

    res.json(service);
  } catch (err) {
    console.error("Update service error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await models.RepairServiceType.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Service type not found" });

    // Assuming we do soft deletes instead of wiping out invoice or repair histories
    await service.update({ isActive: false });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "SERVICE_DELETED",
      entityType: "RepairServiceType",
      entityId: service.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Service successfully disabled" });
  } catch (err) {
    console.error("Delete service error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
