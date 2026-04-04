import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const CustomerAddress = sequelize.define(
    "CustomerAddress",
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
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressLine: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "address_line",
      },
      cityDistrict: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "city_district",
      },
      nearestBranch: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "nearest_branch",
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      plusCode: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "plus_code",
        comment: "Google Maps share URL or Plus Code for this address",
      },
      logisticsCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "logistics_code",
        comment: "Internal logistics reference code for this address (e.g. KTM-07, PKR-12)",
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_default",
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
      tableName: "customer_addresses",
      timestamps: true,
      underscored: true,
    }
  );

  CustomerAddress.associate = (models) => {
    CustomerAddress.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    // Will associate with repairs, subscriptions later if needed
  };

  return CustomerAddress;
};
