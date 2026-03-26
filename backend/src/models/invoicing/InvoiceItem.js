import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const InvoiceItem = sequelize.define(
    "InvoiceItem",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "invoice_id",
      },
      repairOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "repair_order_id",
      },
      parentItemId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "parent_item_id",
      },
      chargeTypeId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "charge_type_id",
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 1,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "unit_price",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sourcePartUsageId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "source_part_usage_id",
      },
      addedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "added_by_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "invoice_items",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  InvoiceItem.associate = (models) => {
    InvoiceItem.belongsTo(models.Invoice, {
      foreignKey: "invoiceId",
      as: "invoice",
    });
    InvoiceItem.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
    InvoiceItem.belongsTo(models.ChargeType, {
      foreignKey: "chargeTypeId",
      as: "chargeType",
    });
    InvoiceItem.belongsTo(models.StaffMember, {
      foreignKey: "addedById",
      as: "addedBy",
    });
    InvoiceItem.hasMany(models.InvoiceItem, {
      foreignKey: "parentItemId",
      as: "subItems",
    });
    InvoiceItem.belongsTo(models.InvoiceItem, {
      foreignKey: "parentItemId",
      as: "parentItem",
    });
    // sourcePartUsageId links to RepairPartUsed
    InvoiceItem.belongsTo(models.RepairPartUsed, {
      foreignKey: "sourcePartUsageId",
      as: "sourcePartUsage",
    });
  };

  return InvoiceItem;
};
