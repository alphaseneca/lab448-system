import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const CustomerSubscription = sequelize.define(
    "CustomerSubscription",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "customer_id",
      },
      planId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "plan_id",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      cycleStartAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "cycle_start_at",
      },
      cycleEndAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "cycle_end_at",
      },
      nextVisitDueAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "next_visit_due_at",
      },
      autoRenew: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "auto_renew",
      },
      subscribedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "subscribed_by_id",
      },
      cancelledById: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "cancelled_by_id",
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "cancellation_reason",
      },
      renewedFromId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "renewed_from_id",
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
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
    },
    {
      tableName: "customer_subscriptions",
      timestamps: true,
      underscored: true,
    }
  );

  CustomerSubscription.associate = (models) => {
    CustomerSubscription.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    CustomerSubscription.belongsTo(models.SubscriptionPlan, {
      foreignKey: "planId",
      as: "plan",
    });
    CustomerSubscription.belongsTo(models.StaffMember, {
      foreignKey: "subscribedById",
      as: "subscribedBy",
    });
    CustomerSubscription.belongsTo(models.StaffMember, {
      foreignKey: "cancelledById",
      as: "cancelledBy",
    });
    CustomerSubscription.belongsTo(models.CustomerSubscription, {
      foreignKey: "renewedFromId",
      as: "renewedFrom",
    });
    CustomerSubscription.hasMany(models.CustomerSubscription, {
      foreignKey: "renewedFromId",
      as: "renewals",
    });
    CustomerSubscription.hasMany(models.SubscriptionVisitLog, {
      foreignKey: "subscriptionId",
      as: "visitLogs",
    });
    CustomerSubscription.hasMany(models.Invoice, {
      foreignKey: "subscriptionId",
      as: "invoices",
    });
  };

  return CustomerSubscription;
};
