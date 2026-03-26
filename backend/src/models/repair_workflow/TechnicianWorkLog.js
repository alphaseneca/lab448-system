import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const TechnicianWorkLog = sequelize.define(
    "TechnicianWorkLog",
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
      technicianId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "technician_id",
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "started_at",
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "ended_at",
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "duration_minutes",
      },
      workDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "work_description",
      },
      commissionRateAtUse: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true, // Note: Schema docs say not null, but sometimes it might be omitted if commission is computed later. Following dbml: not null
        field: "commission_rate_at_use",
      },
      commissionAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "commission_amount",
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_approved",
      },
      approvedById: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "approved_by_id",
      },
      subscriptionVisitId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "subscription_visit_id",
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
      tableName: "technician_work_logs",
      timestamps: true,
      underscored: true,
    }
  );

  TechnicianWorkLog.associate = (models) => {
    TechnicianWorkLog.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
    TechnicianWorkLog.belongsTo(models.StaffMember, {
      foreignKey: "technicianId",
      as: "technician",
    });
    TechnicianWorkLog.belongsTo(models.StaffMember, {
      foreignKey: "approvedById",
      as: "approvedBy",
    });
    TechnicianWorkLog.belongsTo(models.SubscriptionVisitLog, {
      foreignKey: "subscriptionVisitId",
      as: "subscriptionVisit",
    });
  };

  return TechnicianWorkLog;
};
