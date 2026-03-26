import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const RepairPartUsed = sequelize.define(
    "RepairPartUsed",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      repairOrderId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "repair_order_id",
      },
      partId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "part_id",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
      },
      unitPriceAtUse: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "unit_price_at_use",
      },
      unitCostAtUse: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "unit_cost_at_use",
      },
      recordedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "recorded_by_id",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "repair_parts_used",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  RepairPartUsed.associate = (models) => {
    RepairPartUsed.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
    RepairPartUsed.belongsTo(models.RepairPartCatalog, {
      foreignKey: "partId",
      as: "part",
    });
    RepairPartUsed.belongsTo(models.StaffMember, {
      foreignKey: "recordedById",
      as: "recordedBy",
    });
    RepairPartUsed.hasOne(models.InvoiceItem, {
      foreignKey: "sourcePartUsageId",
      as: "invoiceItem", // the item that billed this part usage
    });
  };

  return RepairPartUsed;
};
