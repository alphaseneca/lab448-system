import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isCompany: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_company",
      },
      companyContactPerson: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "company_contact_person",
      },
      panNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "pan_number",
      },
      phonePrimary: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "phone_primary",
      },
      phoneSecondary: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "phone_secondary",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      preferredChannel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "SMS",
        field: "preferred_channel",
      },
      intakeSource: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "WALK_IN",
        field: "intake_source",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "customers",
      timestamps: true,
      paranoid: true, // enables deletedAt
      underscored: true,
    }
  );

  Customer.associate = (models) => {
    Customer.hasMany(models.CustomerAddress, {
      foreignKey: "customerId",
      as: "addresses",
    });
    Customer.hasOne(models.CustomerAuth, {
      foreignKey: "customerId",
      as: "auth",
    });
    Customer.hasMany(models.CustomerDevice, {
      foreignKey: "customerId",
      as: "devices",
    });
    Customer.hasMany(models.RepairOrder, {
      foreignKey: "customerId",
      as: "repairOrders",
    });
    Customer.hasMany(models.CustomerSubscription, {
      foreignKey: "customerId",
      as: "subscriptions",
    });
    Customer.hasMany(models.Invoice, {
      foreignKey: "customerId",
      as: "invoices",
    });
    Customer.hasMany(models.WhatsappConversation, {
      foreignKey: "customerId",
      as: "whatsappConversations",
    });
  };

  return Customer;
};
