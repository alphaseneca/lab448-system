import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const WhatsappConversation = sequelize.define(
    "WhatsappConversation",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "customer_id",
      },
      waPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "wa_phone_number",
      },
      waContactName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "wa_contact_name",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "OPEN",
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_message_at",
      },
      assignedToId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "assigned_to_id",
      },
      linkedRepairOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "linked_repair_order_id",
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
      tableName: "whatsapp_conversations",
      timestamps: true,
      underscored: true,
    }
  );

  WhatsappConversation.associate = (models) => {
    WhatsappConversation.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    WhatsappConversation.belongsTo(models.StaffMember, {
      foreignKey: "assignedToId",
      as: "assignedTo",
    });
    WhatsappConversation.belongsTo(models.RepairOrder, {
      foreignKey: "linkedRepairOrderId",
      as: "repairOrder",
    });
    WhatsappConversation.hasMany(models.CommunicationLog, {
      foreignKey: "whatsappConversationId",
      as: "logs",
    });
  };

  return WhatsappConversation;
};
