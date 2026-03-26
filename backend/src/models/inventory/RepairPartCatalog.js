import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const RepairPartCatalog = sequelize.define(
    "RepairPartCatalog",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pcs",
      },
      availableQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "available_quantity",
      },
      reorderThreshold: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "reorder_threshold",
      },
      reorderQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "reorder_quantity",
      },
      unitCostPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "unit_cost_price",
      },
      unitSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "unit_sell_price",
      },
      locationId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "location_id",
      },
      supplierId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "supplier_id",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
    },
    {
      tableName: "repair_parts_catalog",
      timestamps: true,
      underscored: true,
    }
  );

  RepairPartCatalog.associate = (models) => {
    RepairPartCatalog.belongsTo(models.PartLocation, {
      foreignKey: "locationId",
      as: "location",
    });
    RepairPartCatalog.belongsTo(models.Supplier, {
      foreignKey: "supplierId",
      as: "supplier",
    });

    RepairPartCatalog.hasMany(models.RepairPartUsed, {
      foreignKey: "partId",
      as: "usageHistory",
    });
    RepairPartCatalog.hasMany(models.StockMovement, {
      foreignKey: "partId",
      as: "stockMovements",
    });
    RepairPartCatalog.hasMany(models.PurchaseOrderItem, {
      foreignKey: "partId",
      as: "purchaseOrderItems",
    });
  };

  return RepairPartCatalog;
};
