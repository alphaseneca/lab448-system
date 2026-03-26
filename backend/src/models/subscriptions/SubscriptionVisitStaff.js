import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SubscriptionVisitStaff = sequelize.define(
    "SubscriptionVisitStaff",
    {
      visitId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        field: "visit_id",
        references: {
          model: "subscription_visit_logs",
          key: "id",
        },
      },
      technicianId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        field: "technician_id",
        references: {
          model: "staff_members",
          key: "id",
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ASSISTANT",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "subscription_visit_staff",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  SubscriptionVisitStaff.associate = (models) => {
    SubscriptionVisitStaff.belongsTo(models.SubscriptionVisitLog, {
      foreignKey: "visitId",
      as: "visitLog",
    });
    SubscriptionVisitStaff.belongsTo(models.StaffMember, {
      foreignKey: "technicianId",
      as: "technician",
    });
  };

  return SubscriptionVisitStaff;
};
