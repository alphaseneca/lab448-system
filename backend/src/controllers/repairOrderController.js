import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { ROLES, INTAKE_SOURCES, REPAIR_STATUSES, REPAIR_PRIORITIES, REPAIR_LOCATIONS, ALLOWED_STATUS_TRANSITIONS, REF_COUNTER_TYPES } from "../utils/constants.js";
import { FRONTDESK_CHARGE } from "../config.js";

// =====================================
// Repair Workflow API
// =====================================

const generateNextTicketNumber = async (transaction) => {
  const counterType = REF_COUNTER_TYPES.REPAIR_ORDER;
  const [counter] = await models.RefCounter.findOrCreate({
    where: { counterType },
    defaults: {
      counterType,
      prefix: "RO",
      lastValue: 0,
      padLength: 6,
    },
    transaction,
  });

  counter.lastValue = Number(counter.lastValue || 0) + 1;
  await counter.save({ transaction });

  const padded = String(counter.lastValue).padStart(counter.padLength || 6, "0");
  return `${counter.prefix}-${padded}`;
};

const generateNextQrToken = async (transaction) => {
  const year = new Date().getFullYear();
  const [counter] = await models.RefCounter.findOrCreate({
    where: { counterType: REF_COUNTER_TYPES.QR_TOKEN },
    defaults: {
      counterType: REF_COUNTER_TYPES.QR_TOKEN,
      prefix: `LAB448${year}`,
      lastValue: 0,
      padLength: 4,
    },
    transaction,
  });

  if (!String(counter.prefix).startsWith(`LAB448${year}`)) {
    counter.prefix = `LAB448${year}`;
    counter.lastValue = 0;
  }

  counter.lastValue = Number(counter.lastValue || 0) + 1;
  await counter.save({ transaction });
  return `${counter.prefix}${String(counter.lastValue).padStart(counter.padLength || 4, "0")}`;
};

export const listRepairOrders = async (req, res) => {
  try {
    const q = req.query;
    const where = {};
    if (q.status) where.status = q.status;
    if (q.assignedTo) where.assignedToId = q.assignedTo;

    // Role-based filtering as discussed!
    // If the user is a Technician, they only see their assigned repairs
    const userRoleCode = req.user.roleCode;
    if (userRoleCode === ROLES.TECHNICIAN) {
      where.assignedToId = req.user.id;
    }

    const repairs = await models.RepairOrder.findAndCountAll({
      where,
      include: [
        { model: models.CustomerDevice, as: "device" },
        { model: models.Customer, as: "customer" },
        {
          model: models.StaffMember,
          as: "assignedTo",
          attributes: ["id", "fullName", "email"]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(q.limit, 10) || 50,
      offset: parseInt(q.offset, 10) || 0,
    });

    res.json({
      total: repairs.count,
      data: repairs.rows,
    });
  } catch (err) {
    console.error("List repairs error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRepairById = async (req, res) => {
  try {
    const repair = await models.RepairOrder.findByPk(req.params.id, {
      include: [
        { model: models.CustomerDevice, as: "device" },
        { model: models.Customer, as: "customer" },
        { model: models.StaffMember, as: "assignedTo", attributes: ["id", "fullName"] },
        { model: models.RepairStatusLog, as: "statusLogs" }
      ],
    });

    if (!repair) {
      return res.status(404).json({ message: "Repair order not found" });
    }

    res.json(repair);
  } catch (err) {
    console.error("Get repair by ID error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRepairByToken = async (req, res) => {
  try {
    const repair = await models.RepairOrder.findOne({
      where: { qrToken: req.params.token },
      include: [
        { model: models.CustomerDevice, as: "device" },
        { model: models.Customer, as: "customer" },
      ],
    });

    if (!repair) {
      return res.status(404).json({ message: "Repair token not found" });
    }
    
    // Auth Check: Can this technician see it?
    if (req.user.roleCode === ROLES.TECHNICIAN && repair.assignedTo && repair.assignedTo !== req.user.id) {
       return res.status(403).json({ message: "This repair is assigned to a different technician" });
    }

    res.json(repair);
  } catch (err) {
    console.error("Get repair by token error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createRepairOrder = async (req, res) => {
  const { 
    customerId, deviceId, device, serviceTypeId, priority,
    intakeNotes, internalNotes,
    hasDelivery, pickupAddressId, deliveryAddressId, pickupScheduledAt, deliveryScheduledAt,
    expectedCompletionAt, qrToken, subscriptionId, subscriptionVisitId, repairLocation, intakeSource, defaultServiceCharge
  } = req.body;

  if (!customerId || (!deviceId && !device)) {
    return res.status(400).json({ message: "Customer and Device are required" });
  }

  const t = await models.sequelize.transaction();

  try {
    let finalDeviceId = deviceId;
    if (!finalDeviceId && device) {
      const newDevice = await models.CustomerDevice.create({
        customerId,
        brand: device.brand,
        modelName: device.modelName,
        serialNumber: device.serialNumber,
        reportedIssue: intakeNotes || null,
      }, { transaction: t });
      finalDeviceId = newDevice.id;
    }

    const ticketNumber = await generateNextTicketNumber(t);
    const generatedQrToken = qrToken || await generateNextQrToken(t);
    const serviceType = serviceTypeId
      ? await models.RepairServiceType.findByPk(serviceTypeId, { transaction: t })
      : null;
    const computedServiceCharge =
      defaultServiceCharge !== undefined && defaultServiceCharge !== null
        ? Number(defaultServiceCharge || 0)
        : Number(serviceType?.defaultServiceCharge || 0) + Number(FRONTDESK_CHARGE || 0);

    const allowedIntakeSources = new Set([
      INTAKE_SOURCES.WALK_IN,
      INTAKE_SOURCES.WEBSITE,
      INTAKE_SOURCES.WHATSAPP,
      INTAKE_SOURCES.PHONE,
    ]);
    const validIntakeSource = allowedIntakeSources.has(intakeSource)
      ? intakeSource
      : INTAKE_SOURCES.WALK_IN;

    const repair = await models.RepairOrder.create({
      ticketNumber,
      customerId,
      createdById: req.user.id,
      deviceId: finalDeviceId,
      serviceTypeId: serviceTypeId || null,
      intakeChannel: validIntakeSource,
      status: REPAIR_STATUSES.PENDING,
      priority: priority || REPAIR_PRIORITIES.NORMAL,
      intakeNotes: intakeNotes || null,
      internalNotes: internalNotes || null,
      isLocked: false,
      hasDelivery: hasDelivery || false,
      pickupAddressId: pickupAddressId || null,
      deliveryAddressId: deliveryAddressId || null,
      pickupScheduledAt: pickupScheduledAt || null,
      deliveryScheduledAt: deliveryScheduledAt || null,
      estimatedCompletionAt: expectedCompletionAt || null,
      qrToken: generatedQrToken,
      defaultServiceCharge: computedServiceCharge,
      subscriptionId: subscriptionId || null,
      subscriptionVisitId: subscriptionVisitId || null,
      repairLocation: repairLocation || REPAIR_LOCATIONS.SHOP,
      intakeAt: new Date()
    }, { transaction: t });

    // Build the initial status log
    await models.RepairStatusLog.create({
      repairOrderId: repair.id,
      fromStatus: null,
      toStatus: REPAIR_STATUSES.PENDING,
      changedById: req.user.id,
      notes: "Initial Intake",
    }, { transaction: t });
    
    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "REPAIR_CREATED",
      entityType: "RepairOrder",
      entityId: repair.id,
      repairOrderId: repair.id,
      afterSnapshot: repair.toJSON(),
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.status(201).json(repair);
  } catch (err) {
    await t.rollback();
    console.error("Create repair error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const transitionRepairStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus, reason } = req.body;

  if (!newStatus) return res.status(400).json({ message: "newStatus is required" });

  const t = await models.sequelize.transaction();
  try {
    const repair = await models.RepairOrder.findByPk(id, { transaction: t });
    if (!repair) {
       await t.rollback();
       return res.status(404).json({ message: "Repair not found" });
    }

    const oldStatus = repair.status;
    if (oldStatus === newStatus) {
       await t.rollback();
       return res.json(repair); // No change
    }

    // Status Transition Validation
    const allowed = ALLOWED_STATUS_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      await t.rollback();
      return res.status(400).json({ 
        message: `Invalid status transition from ${oldStatus} to ${newStatus}`,
        allowedTransitions: allowed 
      });
    }

    // Assigning the repairing tech logic. If transitioning to IN_REPAIR, and no one is assigned, assign to req.user.
    if (newStatus === REPAIR_STATUSES.IN_REPAIR && !repair.assignedToId) {
      repair.assignedToId = req.user.id;
    }
    
    // Setting completedAt stamp
    if (newStatus === REPAIR_STATUSES.READY_FOR_DELIVERY || newStatus === REPAIR_STATUSES.DELIVERED) {
        if (!repair.completedAt) repair.completedAt = new Date();
    }
    
    // Setting delivered timestamp
    if (newStatus === REPAIR_STATUSES.DELIVERED) {
        repair.deliveredAt = new Date();
    }

    repair.status = newStatus;
    const beforeSnapshot = repair.toJSON();
    await repair.save({ transaction: t });

    await models.RepairStatusLog.create({
      repairOrderId: repair.id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedById: req.user.id,
      notes: reason || "Status changed via API",
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "REPAIR_STATUS_CHANGED",
      entityType: "RepairOrder",
      entityId: repair.id,
      repairOrderId: repair.id,
      beforeSnapshot,
      afterSnapshot: repair.toJSON(),
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.json(repair);
  } catch (err) {
    await t.rollback();
    console.error("Transition status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRepairOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const repair = await models.RepairOrder.findByPk(id);
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    const beforeSnapshot = repair.toJSON();

    const {
      serviceTypeId, assignedToId, priority, intakeNotes, internalNotes,
      diagnosisNotes, resolutionNotes, defaultServiceCharge, isLocked,
      hasDelivery, pickupAddressId, deliveryAddressId, pickupScheduledAt, deliveryScheduledAt,
      estimatedCompletionAt, pickupAssignedToId, deliveryAssignedToId, deviceLocation
    } = req.body;

    await repair.update({
      serviceTypeId: serviceTypeId !== undefined ? serviceTypeId : repair.serviceTypeId,
      assignedToId: assignedToId !== undefined ? assignedToId : repair.assignedToId,
      priority: priority !== undefined ? priority : repair.priority,
      intakeNotes: intakeNotes !== undefined ? intakeNotes : repair.intakeNotes,
      internalNotes: internalNotes !== undefined ? internalNotes : repair.internalNotes,
      diagnosisNotes: diagnosisNotes !== undefined ? diagnosisNotes : repair.diagnosisNotes,
      resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : repair.resolutionNotes,
      defaultServiceCharge: defaultServiceCharge !== undefined ? defaultServiceCharge : repair.defaultServiceCharge,
      isLocked: isLocked !== undefined ? isLocked : repair.isLocked,
      hasDelivery: hasDelivery !== undefined ? hasDelivery : repair.hasDelivery,
      pickupAddressId: pickupAddressId !== undefined ? pickupAddressId : repair.pickupAddressId,
      deliveryAddressId: deliveryAddressId !== undefined ? deliveryAddressId : repair.deliveryAddressId,
      pickupScheduledAt: pickupScheduledAt !== undefined ? pickupScheduledAt : repair.pickupScheduledAt,
      deliveryScheduledAt: deliveryScheduledAt !== undefined ? deliveryScheduledAt : repair.deliveryScheduledAt,
      estimatedCompletionAt: estimatedCompletionAt !== undefined ? estimatedCompletionAt : repair.estimatedCompletionAt,
      pickupAssignedToId: pickupAssignedToId !== undefined ? pickupAssignedToId : repair.pickupAssignedToId,
      deliveryAssignedToId: deliveryAssignedToId !== undefined ? deliveryAssignedToId : repair.deliveryAssignedToId,
      deviceLocation: deviceLocation !== undefined ? deviceLocation : repair.deviceLocation
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "REPAIR_UPDATED",
      entityType: "RepairOrder",
      entityId: repair.id,
      repairOrderId: repair.id,
      beforeSnapshot,
      afterSnapshot: repair.toJSON(),
      ipAddress: req.ip,
    });

    res.json(repair);
  } catch (err) {
    console.error("Update repair error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteRepairOrder = async (req, res) => {
  try {
    const repair = await models.RepairOrder.findByPk(req.params.id);
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    await repair.destroy(); // Hard delete for repair tickets typically per requirements, or soft if implemented globally later.

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "REPAIR_DELETED",
      entityType: "RepairOrder",
      entityId: repair.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Repair successfully deleted" });
  } catch (err) {
    console.error("Delete repair error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
