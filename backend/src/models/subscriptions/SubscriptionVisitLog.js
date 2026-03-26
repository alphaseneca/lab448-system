import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const SubscriptionVisitLog = sequelize.define(
    "SubscriptionVisitLog",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      subscriptionId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "subscription_id",
      },
      visitAddressId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "visit_address_id",
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "scheduled_at",
      },
      visitedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "visited_at",
      },
      visitNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "visit_notes",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "SCHEDULED",
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
      tableName: "subscription_visit_logs",
      timestamps: true,
      underscored: true,
    }
  );

  SubscriptionVisitLog.associate = (models) => {
    SubscriptionVisitLog.belongsTo(models.CustomerSubscription, {
      foreignKey: "subscriptionId",
      as: "subscription",
    });
    SubscriptionVisitLog.belongsTo(models.CustomerAddress, {
      foreignKey: "visitAddressId",
      as: "visitAddress",
    });
    SubscriptionVisitLog.belongsTo(models.StaffMember, {
      foreignKey: "createdById",
      as: "createdBy",
    });
    SubscriptionVisitLog.hasMany(models.SubscriptionVisitStaff, {
      foreignKey: "visitId",
      as: "staffGroup",
    });
    SubscriptionVisitLog.hasMany(models.SubscriptionVisitFinding, {
      foreignKey: "visitId",
      as: "findings",
    });
    SubscriptionVisitLog.hasMany(models.RepairOrder, {
      foreignKey: "subscriptionVisitId",
      as: "repairOrders",
    });
    SubscriptionVisitLog.hasMany(models.TechnicianWorkLog, {
      foreignKey: "subscriptionVisitId",
      as: "workLogs",
    });
  };

  return SubscriptionVisitLog;
};
