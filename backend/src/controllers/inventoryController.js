import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { STOCK_MOVEMENT_TYPES } from "../utils/constants.js";
import { Op } from "sequelize";

// =====================================
// Inventory API (Domain 6)
// =====================================

export const listParts = async (req, res) => {
  try {
    const parts = await models.RepairPartCatalog.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    res.json(parts);
  } catch (err) {
    console.error("List parts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPart = async (req, res) => {
  const {
    sku,
    name,
    description,
    category,
    unitCostPrice,
    unitSellPrice,
    reorderThreshold,
    availableQuantity,
    minStockLevel,
    currentStock,
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const t = await models.sequelize.transaction();
  try {
    let finalSku = sku;
    if (!finalSku) {
      const existing = await models.RepairPartCatalog.findAll({
        attributes: ["sku"],
        where: { sku: { [Op.like]: "LABSKU-%" } },
        transaction: t,
      });
      let highest = 0;
      existing.forEach((row) => {
        const raw = row.sku || "";
        const parsed = Number(raw.replace("LABSKU-", ""));
        if (!Number.isNaN(parsed) && parsed > highest) highest = parsed;
      });
      finalSku = `LABSKU-${highest + 1}`;
    }

    const part = await models.RepairPartCatalog.create({
      sku: finalSku,
      name,
      description,
      category: category || "GENERAL",
      unitCostPrice: unitCostPrice || 0,
      unitSellPrice: unitSellPrice || 0,
      reorderThreshold: reorderThreshold ?? minStockLevel ?? 0,
      availableQuantity: availableQuantity ?? currentStock ?? 0,
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "PART_CREATED",
      entityType: "RepairPartCatalog",
      entityId: part.id,
      afterSnapshot: part.toJSON(),
      ipAddress: req.ip,
    }, t);

    // If starting with stock, log the stock movement
    const initialQty = Number(availableQuantity ?? currentStock ?? 0);
    if (initialQty > 0) {
       await models.StockMovement.create({
         partId: part.id,
         movementType: STOCK_MOVEMENT_TYPES.IN,
         quantity: initialQty,
         referenceId: `INIT-${part.id}`,
         performedById: req.user.id,
         notes: "Initial stock entry",
       }, { transaction: t });
    }

    await t.commit();
    res.status(201).json(part);
  } catch (err) {
    await t.rollback();
    if (err.name === "SequelizeUniqueConstraintError") {
       return res.status(400).json({ message: "SKU already exists" });
    }
    console.error("Create part error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, notes, supplierId } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Positive quantity required" });
  }

  const t = await models.sequelize.transaction();
  try {
    const part = await models.RepairPartCatalog.findByPk(id, { transaction: t });
    if (!part) {
       await t.rollback();
       return res.status(404).json({ message: "Part not found" });
    }

    part.availableQuantity += Number(quantity);
    await part.save({ transaction: t });

    await models.StockMovement.create({
      partId: part.id,
      movementType: STOCK_MOVEMENT_TYPES.IN,
      quantity,
      performedById: req.user.id,
      notes,
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "STOCK_ADDED",
      entityType: "RepairPartCatalog",
      entityId: part.id,
      ipAddress: req.ip,
    }, t);

    await t.commit();
    res.json(part);
  } catch (err) {
    await t.rollback();
    console.error("Add stock error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePart = async (req, res) => {
  const { id } = req.params;
  const { sku, name, description, category, unitCostPrice, unitSellPrice, reorderThreshold, minStockLevel } = req.body;
  
  try {
    const part = await models.RepairPartCatalog.findByPk(id);
    if (!part) return res.status(404).json({ message: "Part not found" });

    const beforeSnapshot = part.toJSON();

    await part.update({
      sku: sku !== undefined ? sku : part.sku,
      name: name !== undefined ? name : part.name,
      description: description !== undefined ? description : part.description,
      category: category !== undefined ? category : part.category,
      unitCostPrice: unitCostPrice !== undefined ? unitCostPrice : part.unitCostPrice,
      unitSellPrice: unitSellPrice !== undefined ? unitSellPrice : part.unitSellPrice,
      reorderThreshold:
        reorderThreshold !== undefined
          ? reorderThreshold
          : minStockLevel !== undefined
            ? minStockLevel
            : part.reorderThreshold
    });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "PART_UPDATED",
      entityType: "RepairPartCatalog",
      entityId: part.id,
      beforeSnapshot,
      afterSnapshot: part.toJSON(),
      ipAddress: req.ip,
    });

    res.json(part);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
       return res.status(400).json({ message: "SKU already exists" });
    }
    console.error("Update part error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePart = async (req, res) => {
  try {
    const part = await models.RepairPartCatalog.findByPk(req.params.id);
    if (!part) return res.status(404).json({ message: "Part not found" });

    await part.update({ isActive: false });

    await logAudit({
      userId: req.user.id,
      actorType: "STAFF",
      eventName: "PART_DELETED",
      entityType: "RepairPartCatalog",
      entityId: part.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Part effectively disabled" });
  } catch (err) {
    console.error("Delete part error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
