import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      poNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "po_number",
      },
      supplierId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "supplier_id",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "DRAFT",
      },
      orderedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "ordered_at",
      },
      expectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "expected_at",
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "received_at",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "total_amount",
      },
      createdById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "created_by_id",
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
      tableName: "purchase_orders",
      timestamps: true,
      underscored: true,
    }
  );

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Supplier, {
      foreignKey: "supplierId",
      as: "supplier",
    });
    PurchaseOrder.belongsTo(models.StaffMember, {
      foreignKey: "createdById",
      as: "createdBy",
    });
    PurchaseOrder.hasMany(models.PurchaseOrderItem, {
      foreignKey: "purchaseOrderId",
      as: "items",
    });
  };

  return PurchaseOrder;
};
