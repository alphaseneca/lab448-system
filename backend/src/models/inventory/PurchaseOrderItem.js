import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const PurchaseOrderItem = sequelize.define(
    "PurchaseOrderItem",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      purchaseOrderId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "purchase_order_id",
      },
      partId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "part_id",
      },
      quantityOrdered: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "quantity_ordered",
      },
      quantityReceived: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "quantity_received",
      },
      unitCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "unit_cost",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "purchase_order_items",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  PurchaseOrderItem.associate = (models) => {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, {
      foreignKey: "purchaseOrderId",
      as: "purchaseOrder",
    });
    PurchaseOrderItem.belongsTo(models.RepairPartCatalog, {
      foreignKey: "partId",
      as: "part",
    });
  };

  return PurchaseOrderItem;
};
