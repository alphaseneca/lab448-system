import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const RepairStatusLog = sequelize.define(
    "RepairStatusLog",
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
      fromStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "from_status",
      },
      toStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "to_status",
      },
      changedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "changed_by_id",
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
      tableName: "repair_status_logs",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  RepairStatusLog.associate = (models) => {
    RepairStatusLog.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
    RepairStatusLog.belongsTo(models.StaffMember, {
      foreignKey: "changedById",
      as: "changedBy",
    });
  };

  return RepairStatusLog;
};
