import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const CommunicationLog = sequelize.define(
    "CommunicationLog",
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
      repairOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "repair_order_id",
      },
      whatsappConversationId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "whatsapp_conversation_id",
      },
      channel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      direction: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sentById: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "sent_by_id",
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "event_type",
      },
      recipientOrSender: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "recipient_or_sender",
      },
      messageBody: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "message_body",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "SENT",
      },
      providerMessageId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "provider_message_id",
      },
      providerResponse: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "provider_response",
      },
      sentOrReceivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "sent_or_received_at",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "communication_logs",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  CommunicationLog.associate = (models) => {
    CommunicationLog.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    CommunicationLog.belongsTo(models.RepairOrder, {
      foreignKey: "repairOrderId",
      as: "repairOrder",
    });
    CommunicationLog.belongsTo(models.WhatsappConversation, {
      foreignKey: "whatsappConversationId",
      as: "conversation",
    });
    CommunicationLog.belongsTo(models.StaffMember, {
      foreignKey: "sentById",
      as: "sentBy",
    });
  };

  return CommunicationLog;
};
