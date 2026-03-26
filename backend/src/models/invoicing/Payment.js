import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "invoice_id",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "payment_method",
      },
      referenceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference_number",
      },
      receivedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "received_by_id",
      },
      paymentNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "payment_note",
      },
      qrProvider: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "qr_provider",
      },
      qrReferenceId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: "qr_reference_id",
      },
      qrProviderTxnId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "qr_provider_txn_id",
      },
      qrPayload: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "qr_payload",
      },
      qrDeeplinkUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "qr_deeplink_url",
      },
      qrImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "qr_image_url",
      },
      qrStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "qr_status",
      },
      qrExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "qr_expires_at",
      },
      qrScannedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "qr_scanned_at",
      },
      qrVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "qr_verified_at",
      },
      qrLastPolledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "qr_last_polled_at",
      },
      qrRawResponse: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "qr_raw_response",
      },
      qrRawCallback: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "qr_raw_callback",
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "received_at",
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
      tableName: "payments",
      timestamps: true,
      underscored: true,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Invoice, {
      foreignKey: "invoiceId",
      as: "invoice",
    });
    Payment.belongsTo(models.StaffMember, {
      foreignKey: "receivedById",
      as: "receivedBy",
    });
  };

  return Payment;
};
