import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const ChargeType = sequelize.define(
    "ChargeType",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      parentId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "parent_id",
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isDiscount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_discount",
      },
      isTax: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_tax",
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "sort_order",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
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
      tableName: "charge_types",
      timestamps: true,
      underscored: true,
    }
  );

  ChargeType.associate = (models) => {
    ChargeType.hasMany(models.ChargeType, {
      foreignKey: "parentId",
      as: "children",
    });
    ChargeType.belongsTo(models.ChargeType, {
      foreignKey: "parentId",
      as: "parent",
    });
    ChargeType.hasMany(models.InvoiceItem, {
      foreignKey: "chargeTypeId",
      as: "invoiceItems",
    });
  };

  return ChargeType;
};
