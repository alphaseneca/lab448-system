import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const CustomerDevice = sequelize.define(
    "CustomerDevice",
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
      deviceTypeId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "device_type_id",
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      modelName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "model_name",
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      serialNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "serial_number",
      },
      purchaseYear: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        field: "purchase_year",
      },
      hasWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "has_warranty",
      },
      reportedIssue: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "reported_issue",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
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
      tableName: "customer_devices",
      timestamps: true,
      paranoid: true, // enables deletedAt
      underscored: true,
    }
  );

  CustomerDevice.associate = (models) => {
    CustomerDevice.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    CustomerDevice.belongsTo(models.RepairDeviceType, {
      foreignKey: "deviceTypeId",
      as: "deviceType",
    });
    CustomerDevice.hasMany(models.RepairOrder, {
      foreignKey: "deviceId",
      as: "repairOrders",
    });
  };

  return CustomerDevice;
};
