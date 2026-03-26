import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const SubscriptionVisitFinding = sequelize.define(
    "SubscriptionVisitFinding",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      visitId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "visit_id",
      },
      loggedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "logged_by_id",
      },
      customerDeviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "customer_device_id",
      },
      deviceTypeId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "device_type_id",
      },
      deviceDescription: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "device_description",
      },
      reportedIssue: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "reported_issue",
      },
      technicianObservation: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "technician_observation",
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      repairOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "repair_order_id",
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
      tableName: "subscription_visit_findings",
      timestamps: true,
      underscored: true,
    }
  );

  SubscriptionVisitFinding.associate = (models) => {
    SubscriptionVisitFinding.belongsTo(models.SubscriptionVisitLog, {
      foreignKey: "visitId",
      as: "visitLog",
    });
    SubscriptionVisitFinding.belongsTo(models.StaffMember, {
      foreignKey: "loggedById",
      as: "loggedBy",
    });
    SubscriptionVisitFinding.belongsTo(models.CustomerDevice, {
      foreignKey: "customerDeviceId",
      as: "customerDevice",
    });
    SubscriptionVisitFinding.belongsTo(models.RepairDeviceType, {
      foreignKey: "deviceTypeId",
      as: "deviceType",
    });
    SubscriptionVisitFinding.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
  };

  return SubscriptionVisitFinding;
};
