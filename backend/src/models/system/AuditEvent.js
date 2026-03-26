import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const AuditEvent = sequelize.define(
    "AuditEvent",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      performedById: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "performed_by_id",
      },
      actorType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "STAFF",
        field: "actor_type",
      },
      eventName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "event_name",
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "entity_type",
      },
      entityId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "entity_id",
      },
      repairOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "repair_order_id",
      },
      beforeSnapshot: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "before_snapshot",
      },
      afterSnapshot: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "after_snapshot",
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "ip_address",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "audit_events",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  AuditEvent.associate = (models) => {
    AuditEvent.belongsTo(models.StaffMember, {
      foreignKey: "performedById",
      as: "performedBy",
    });
    AuditEvent.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
  };

  return AuditEvent;
};
