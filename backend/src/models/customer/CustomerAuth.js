import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const CustomerAuth = sequelize.define(
    "CustomerAuth",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "customer_id",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "password_hash",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      emailVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "email_verified_at",
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "verification_token",
      },
      tokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "token_expires_at",
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login_at",
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
      tableName: "customer_auth",
      timestamps: true,
      underscored: true,
    }
  );

  CustomerAuth.associate = (models) => {
    CustomerAuth.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
  };

  return CustomerAuth;
};
