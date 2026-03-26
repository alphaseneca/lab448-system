import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";

// =====================================
// Media Attachments API
// =====================================

export const listAttachmentsForRepair = async (req, res) => {
  const { repairId } = req.params;

  try {
    const attachments = await models.MediaAttachment.findAll({
      where: { repairOrderId: repairId },
      include: [{ model: models.StaffMember, as: "uploadedBy", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
    });

    res.json(attachments);
  } catch (err) {
    console.error("List attachments error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadAttachment = async (req, res) => {
  // Assuming a separate middleware like multer has already processed the file upload
  // and attached file data to `req.file` or `req.body`
  const { repairId } = req.params;
  const { fileUrl, mediaType, isBeforeRepair, isVisibleToCustomer } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ message: "fileUrl is required" });
  }

  try {
    const repair = await models.RepairOrder.findByPk(repairId);
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    const attachment = await models.MediaAttachment.create({
      entityType: "repair_order", // matching DBML string format
      entityId: String(repairId),
      fileName: req.body.fileName || `Attachment-${Date.now()}`,
      fileUrl,
      fileType: mediaType || "IMAGE",
      fileSizeBytes: req.body.fileSizeBytes || null,
      label: req.body.label || null,
      uploadedById: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "MEDIA_UPLOADED",
      entityType: "MediaAttachment",
      entityId: attachment.id,
      repairOrderId: repairId,
      afterSnapshot: attachment.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json(attachment);
  } catch (err) {
    console.error("Upload attachment error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await models.MediaAttachment.findByPk(req.params.id);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    await attachment.destroy(); // Alternatively, mark inactive or remove physical file

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "MEDIA_DELETED",
      entityType: "MediaAttachment",
      entityId: attachment.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Attachment deleted successfully" });
  } catch (err) {
    console.error("Delete attachment error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
