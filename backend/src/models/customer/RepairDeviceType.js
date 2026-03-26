import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const RepairDeviceType = sequelize.define(
    "RepairDeviceType",
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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
      tableName: "repair_device_types",
      timestamps: true,
      underscored: true,
    }
  );

  RepairDeviceType.associate = (models) => {
    RepairDeviceType.hasMany(models.RepairDeviceType, {
      foreignKey: "parentId",
      as: "children",
    });
    RepairDeviceType.belongsTo(models.RepairDeviceType, {
      foreignKey: "parentId",
      as: "parent",
    });
    RepairDeviceType.hasMany(models.CustomerDevice, {
      foreignKey: "deviceTypeId",
      as: "devices",
    });
  };

  return RepairDeviceType;
};
