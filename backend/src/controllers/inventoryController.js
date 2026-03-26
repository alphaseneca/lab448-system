import models from "../models/index.js";
import { logAudit } from "../middleware/audit.js";
import { STOCK_MOVEMENT_TYPES } from "../utils/constants.js";

// =====================================
// Inventory API (Domain 6)
// =====================================

export const listParts = async (req, res) => {
  try {
    const parts = await models.RepairPartCatalog.findAll({
      order: [["name", "ASC"]],
    });
    res.json(parts);
  } catch (err) {
    console.error("List parts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPart = async (req, res) => {
  const { sku, name, description, category, unitCostPrice, unitSellPrice, minStockLevel, currentStock } = req.body;

  if (!sku || !name) {
    return res.status(400).json({ message: "SKU and Name are required" });
  }

  const t = await models.sequelize.transaction();
  try {
    const part = await models.RepairPartCatalog.create({
      sku, name, description, category: category || "GENERAL", unitCostPrice, unitSellPrice: unitSellPrice || 0, minStockLevel: minStockLevel || 0, currentStock: currentStock || 0
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
    if (currentStock > 0) {
       await models.StockMovement.create({
         partId: part.id,
         movementType: STOCK_MOVEMENT_TYPES.IN,
         quantity: currentStock,
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

    part.currentStock += Number(quantity);
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
  const { sku, name, description, category, unitCostPrice, unitSellPrice, minStockLevel } = req.body;
  
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
      minStockLevel: minStockLevel !== undefined ? minStockLevel : part.minStockLevel
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
