import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const RepairOrder = sequelize.define(
    "RepairOrder",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      ticketNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "ticket_number",
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "customer_id",
      },
      createdById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "created_by_id",
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "device_id",
      },
      assignedToId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "assigned_to_id",
      },
      serviceTypeId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "service_type_id",
      },
      intakeChannel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "WALK_IN",
        field: "intake_channel",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NORMAL",
      },
      intakeNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "intake_notes",
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "internal_notes",
      },
      diagnosisNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "diagnosis_notes",
      },
      resolutionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "resolution_notes",
      },
      defaultServiceCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "default_service_charge",
      },
      isLocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_locked",
      },
      hasDelivery: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "has_delivery",
      },
      pickupAddressId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "pickup_address_id",
      },
      deliveryAddressId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "delivery_address_id",
      },
      pickupScheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "pickup_scheduled_at",
      },
      deliveryScheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "delivery_scheduled_at",
      },
      estimatedCompletionAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "estimated_completion_at",
      },
      intakeAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "intake_at",
      },
      queuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "queued_at",
      },
      inProgressAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "in_progress_at",
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "completed_at",
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "delivered_at",
      },
      subscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "subscription_id",
      },
      subscriptionVisitId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "subscription_visit_id",
      },
      repairLocation: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "SHOP",
        field: "repair_location",
      },
      pickupAssignedToId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "pickup_assigned_to_id",
      },
      deliveryAssignedToId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "delivery_assigned_to_id",
      },
      deviceLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "device_location",
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
      tableName: "repair_orders",
      timestamps: true,
      underscored: true,
    }
  );

  RepairOrder.associate = (models) => {
    RepairOrder.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    RepairOrder.belongsTo(models.StaffMember, {
      foreignKey: "createdById",
      as: "createdBy",
    });
    RepairOrder.belongsTo(models.CustomerDevice, {
      foreignKey: "deviceId",
      as: "device",
    });
    RepairOrder.belongsTo(models.StaffMember, {
      foreignKey: "assignedToId",
      as: "assignedTo",
    });
    RepairOrder.belongsTo(models.RepairServiceType, {
      foreignKey: "serviceTypeId",
      as: "serviceType",
    });
    RepairOrder.belongsTo(models.CustomerAddress, {
      foreignKey: "pickupAddressId",
      as: "pickupAddress",
    });
    RepairOrder.belongsTo(models.CustomerAddress, {
      foreignKey: "deliveryAddressId",
      as: "deliveryAddress",
    });
    RepairOrder.belongsTo(models.CustomerSubscription, {
      foreignKey: "subscriptionId",
      as: "subscription",
    });
    RepairOrder.belongsTo(models.SubscriptionVisitLog, {
      foreignKey: "subscriptionVisitId",
      as: "subscriptionVisit",
    });
    RepairOrder.belongsTo(models.StaffMember, {
      foreignKey: "pickupAssignedToId",
      as: "pickupAssignedTo",
    });
    RepairOrder.belongsTo(models.StaffMember, {
      foreignKey: "deliveryAssignedToId",
      as: "deliveryAssignedTo",
    });

    RepairOrder.hasMany(models.RepairStatusLog, {
      foreignKey: "repairOrderId",
      as: "statusLogs",
    });
    RepairOrder.hasMany(models.TechnicianWorkLog, {
      foreignKey: "repairOrderId",
      as: "workLogs",
    });
    RepairOrder.hasMany(models.InvoiceItem, {
      foreignKey: "repairOrderId",
      as: "invoiceItems",
    });
    RepairOrder.hasMany(models.RepairPartUsed, {
      foreignKey: "repairOrderId",
      as: "partsUsed",
    });
    RepairOrder.hasMany(models.WhatsappConversation, {
      foreignKey: "linkedRepairOrderId",
      as: "whatsappConversations",
    });
    RepairOrder.hasMany(models.CommunicationLog, {
      foreignKey: "repairOrderId",
      as: "communicationLogs",
    });
    RepairOrder.hasMany(models.AuditEvent, {
      foreignKey: "repairOrderId",
      as: "auditEvents",
    });
    RepairOrder.hasMany(models.SubscriptionVisitFinding, {
      foreignKey: "repairOrderId",
      as: "visitFindings",
    });
  };

  return RepairOrder;
};
