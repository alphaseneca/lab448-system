import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const SubscriptionPlan = sequelize.define(
    "SubscriptionPlan",
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      billingCycle: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "billing_cycle",
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      visitFrequency: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "visit_frequency",
      },
      maxVisitsPerCycle: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "max_visits_per_cycle",
      },
      deskChargeWaived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "desk_charge_waived",
      },
      basicRepairCoverageAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "basic_repair_coverage_amount",
      },
      coverageNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "coverage_notes",
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
      tableName: "subscription_plans",
      timestamps: true,
      underscored: true,
    }
  );

  SubscriptionPlan.associate = (models) => {
    SubscriptionPlan.hasMany(models.CustomerSubscription, {
      foreignKey: "planId",
      as: "subscriptions",
    });
  };

  return SubscriptionPlan;
};
