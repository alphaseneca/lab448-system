import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const RepairServiceType = sequelize.define(
    "RepairServiceType",
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
      depth: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      defaultServiceCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "default_service_charge",
      },
      estimatedDurationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "estimated_duration_minutes",
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
      tableName: "repair_service_types",
      timestamps: true,
      underscored: true,
    }
  );

  RepairServiceType.associate = (models) => {
    RepairServiceType.hasMany(models.RepairServiceType, {
      foreignKey: "parentId",
      as: "children",
    });
    RepairServiceType.belongsTo(models.RepairServiceType, {
      foreignKey: "parentId",
      as: "parent",
    });
    RepairServiceType.hasMany(models.RepairOrder, {
      foreignKey: "serviceTypeId",
      as: "repairOrders",
    });
  };

  return RepairServiceType;
};
