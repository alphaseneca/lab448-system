import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { ROLES } from "../utils/constants.js";

// =====================================
// Technician Work Logs API
// =====================================

export const logWork = async (req, res) => {
  const { repairOrderId } = req.params;
  const { startedAt, endedAt, durationMinutes, workDescription, commissionRateAtUse, subscriptionVisitId } = req.body;

  if (!startedAt || !workDescription) {
    return res.status(400).json({ message: "startedAt and workDescription are required" });
  }

  try {
    const repair = await models.RepairOrder.findByPk(repairOrderId);
    if (!repair) return res.status(404).json({ message: "Repair order not found" });

    // Enforce technicians only log their own work
    const isTech = req.user.roleCode === ROLES.TECHNICIAN;
    const technicianId = isTech ? req.user.id : req.body.technicianId;

    if (!technicianId) {
      return res.status(400).json({ message: "technicianId must be provided if you are not logging it directly" });
    }

    // Default rate if not overridden by payload
    let finalCommissionRate = commissionRateAtUse;
    if (finalCommissionRate === undefined) {
      const tech = await models.StaffMember.findByPk(technicianId);
      finalCommissionRate = tech?.commissionRate || 0.00;
    }

    const workLog = await models.TechnicianWorkLog.create({
      repairOrderId,
      technicianId,
      startedAt,
      endedAt: endedAt || null,
      durationMinutes: durationMinutes || null,
      workDescription,
      commissionRateAtUse: finalCommissionRate,
      isApproved: false,
      subscriptionVisitId: subscriptionVisitId || null,
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "WORK_LOGGED",
      entityType: "TechnicianWorkLog",
      entityId: workLog.id,
      repairOrderId,
      afterSnapshot: workLog.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json(workLog);
  } catch (err) {
    console.error("Log work error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listWorkLogs = async (req, res) => {
  const { repairOrderId } = req.params;
  try {
    const logs = await models.TechnicianWorkLog.findAll({
      where: { repairOrderId },
      include: [
        { model: models.StaffMember, as: "technician", attributes: ["id", "fullName", "email"] },
        { model: models.StaffMember, as: "approver", attributes: ["id", "fullName"] }
      ],
      order: [["createdAt", "DESC"]]
    });
    res.json(logs);
  } catch (err) {
    console.error("List work logs error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateWorkLog = async (req, res) => {
  const { logId } = req.params;
  try {
    const log = await models.TechnicianWorkLog.findByPk(logId);
    if (!log) return res.status(404).json({ message: "Work log not found" });

    // Technician lock: techs can only edit their own UNAPPROVED logs
    if (req.user.roleCode === ROLES.TECHNICIAN) {
      if (log.technicianId !== req.user.id) {
        return res.status(403).json({ message: "You can only edit your own work logs" });
      }
      if (log.isApproved) {
        return res.status(403).json({ message: "Cannot edit an approved work log. Contact an administrator." });
      }
    }

    const beforeSnapshot = log.toJSON();
    const { startedAt, endedAt, durationMinutes, workDescription, commissionRateAtUse, isApproved } = req.body;

    await log.update({
      startedAt: startedAt !== undefined ? startedAt : log.startedAt,
      endedAt: endedAt !== undefined ? endedAt : log.endedAt,
      durationMinutes: durationMinutes !== undefined ? durationMinutes : log.durationMinutes,
      workDescription: workDescription !== undefined ? workDescription : log.workDescription,
      commissionRateAtUse: commissionRateAtUse !== undefined ? commissionRateAtUse : log.commissionRateAtUse,
    });

    // Approval checks - restricted to Admins
    if (isApproved !== undefined && req.user.roleCode !== ROLES.TECHNICIAN) {
      log.isApproved = isApproved;
      if (isApproved) {
        log.approvedById = req.user.id;
      } else {
        log.approvedById = null;
      }
      await log.save();
    }

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "WORK_LOG_UPDATED",
      entityType: "TechnicianWorkLog",
      entityId: log.id,
      repairOrderId: log.repairOrderId,
      beforeSnapshot,
      afterSnapshot: log.toJSON(),
      ipAddress: req.ip,
    });

    res.json(log);
  } catch (err) {
    console.error("Update work log error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteWorkLog = async (req, res) => {
  try {
    const log = await models.TechnicianWorkLog.findByPk(req.params.logId);
    if (!log) return res.status(404).json({ message: "Work log not found" });

    if (req.user.roleCode === ROLES.TECHNICIAN) {
      if (log.technicianId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own logs" });
      }
      if (log.isApproved) {
        return res.status(403).json({ message: "Cannot delete approved work logs" });
      }
    }

    await log.destroy(); 
    
    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "WORK_LOG_DELETED",
      entityType: "TechnicianWorkLog",
      entityId: log.id,
      repairOrderId: log.repairOrderId,
      ipAddress: req.ip,
    });

    res.json({ message: "Work log successfully deleted" });
  } catch (err) {
    console.error("Delete log error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
