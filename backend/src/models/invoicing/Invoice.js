import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "invoice_number",
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "customer_id",
      },
      repairOrderId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "repair_order_id",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "DRAFT",
      },
      subtotalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "subtotal_amount",
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "discount_amount",
      },
      discountReason: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "discount_reason",
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        field: "tax_rate",
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "tax_amount",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "total_amount",
      },
      totalPaidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "total_paid_amount",
      },
      staffCommissionAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "staff_commission_amount",
      },
      shopRevenueAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "shop_revenue_amount",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "issued_at",
      },
      dueAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "due_at",
      },
      isLocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_locked",
      },
      createdById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "created_by_id",
      },
      invoiceType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "REPAIR",
        field: "invoice_type",
      },
      subscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "subscription_id",
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
      tableName: "invoices",
      timestamps: true,
      underscored: true,
    }
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    Invoice.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
    Invoice.belongsTo(models.StaffMember, {
      foreignKey: "createdById",
      as: "createdBy",
    });
    Invoice.belongsTo(models.CustomerSubscription, {
      foreignKey: "subscriptionId",
      as: "subscription",
    });

    Invoice.hasMany(models.InvoiceItem, {
      foreignKey: "invoiceId",
      as: "items",
    });
    Invoice.hasMany(models.Payment, {
      foreignKey: "invoiceId",
      as: "payments",
    });
  };

  return Invoice;
};
