import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { COMMUNICATION_CHANNELS, COMMUNICATION_DIRECTIONS, COMMUNICATION_STATUSES } from "../utils/constants.js";

// =====================================
// Communications API (Domain 8)
// =====================================

export const listTemplates = async (req, res) => {
  try {
    const templates = await models.MessageTemplate.findAll({
      order: [["name", "ASC"]],
    });
    res.json(templates);
  } catch (err) {
    console.error("List templates error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationHistory = async (req, res) => {
  const { customerId } = req.params;
  try {
    const logs = await models.CommunicationLog.findAll({
      where: { customerId },
      order: [["sentOrReceivedAt", "DESC"]],
      include: [
          { model: models.StaffMember, as: "sentByStaff", attributes: ["id", "fullName"] },
          { model: models.RepairOrder, as: "repairOrder", attributes: ["id", "status"] }
      ]
    });
    res.json(logs);
  } catch (err) {
    console.error("Get conversation history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logMessage = async (req, res) => {
  const { customerId } = req.params;
  const { repairOrderId, channel, direction, recipientOrSender, messageBody, status } = req.body;

  if (!channel || !direction || !messageBody || !recipientOrSender) {
    return res.status(400).json({ message: "Channel, direction, recipientOrSender, and messageBody are required" });
  }

  const t = await models.sequelize.transaction();
  try {
    const log = await models.CommunicationLog.create({
      customerId,
      repairOrderId: repairOrderId || null,
      channel,
      direction,
      recipientOrSender,
      messageBody,
      sentOrReceivedAt: new Date(),
      sentById: req.user.id,
      status: status || COMMUNICATION_STATUSES.SENT
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "MESSAGE_LOGGED",
      entityType: "CommunicationLog",
      entityId: log.id,
      repairOrderId: repairOrderId || null,
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.status(201).json(log);
  } catch (err) {
    await t.rollback();
    console.error("Log message error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createTemplate = async (req, res) => {
  const { channel, eventType, language, subject, body } = req.body;

  if (!channel || !eventType || !body) {
    return res.status(400).json({ message: "Channel, eventType, and body are required" });
  }

  try {
    const template = await models.MessageTemplate.create({
      channel,
      eventType,
      language: language || 'en',
      subject: subject || null,
      body,
      isActive: true
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "TEMPLATE_CREATED",
      entityType: "MessageTemplate",
      entityId: template.id,
      afterSnapshot: template.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json(template);
  } catch (err) {
    console.error("Create template error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { channel, eventType, language, subject, body, isActive } = req.body;

  try {
    const template = await models.MessageTemplate.findByPk(id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    const beforeSnapshot = template.toJSON();

    await template.update({
      channel: channel !== undefined ? channel : template.channel,
      eventType: eventType !== undefined ? eventType : template.eventType,
      language: language !== undefined ? language : template.language,
      subject: subject !== undefined ? subject : template.subject,
      body: body !== undefined ? body : template.body,
      isActive: isActive !== undefined ? isActive : template.isActive,
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "TEMPLATE_UPDATED",
      entityType: "MessageTemplate",
      entityId: template.id,
      beforeSnapshot,
      afterSnapshot: template.toJSON(),
      ipAddress: req.ip,
    });

    res.json(template);
  } catch (err) {
    console.error("Update template error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await models.MessageTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    await template.update({ isActive: false });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "TEMPLATE_DELETED",
      entityType: "MessageTemplate",
      entityId: template.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Template logically disabled" });
  } catch (err) {
    console.error("Delete template error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
