import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const PartLocation = sequelize.define(
    "PartLocation",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
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
      tableName: "part_locations",
      timestamps: true,
      underscored: true,
    }
  );

  PartLocation.associate = (models) => {
    PartLocation.hasMany(models.RepairPartCatalog, {
      foreignKey: "locationId",
      as: "parts",
    });
  };

  return PartLocation;
};
