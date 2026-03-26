import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const StockMovement = sequelize.define(
    "StockMovement",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      partId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "part_id",
      },
      movementType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "movement_type",
      },
      quantityChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "quantity_change",
      },
      quantityAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "quantity_after",
      },
      referenceId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference_id",
      },
      referenceType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference_type",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recordedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "recorded_by_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "stock_movements",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  StockMovement.associate = (models) => {
    StockMovement.belongsTo(models.RepairPartCatalog, {
      foreignKey: "partId",
      as: "part",
    });
    StockMovement.belongsTo(models.StaffMember, {
      foreignKey: "recordedById",
      as: "recordedBy",
    });
  };

  return StockMovement;
};
