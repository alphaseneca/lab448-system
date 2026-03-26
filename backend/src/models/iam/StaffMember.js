import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const StaffMember = sequelize.define(
    "StaffMember",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      roleId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "role_id",
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "name",
      },
      name: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("fullName");
        },
        set(value) {
          this.setDataValue("fullName", value);
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "password_hash",
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      commissionRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
        field: "commission_rate",
      },
      technicianRank: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "technician_rank",
      },
      technicianRankLabel: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "technician_rank_label",
      },
      lastKnownLat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        field: "last_known_lat",
      },
      lastKnownLng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        field: "last_known_lng",
      },
      lastLocationAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_location_at",
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
      tableName: "staff_members",
      timestamps: true,
      underscored: true,
    }
  );

  StaffMember.associate = (models) => {
    StaffMember.belongsTo(models.Role, {
      foreignKey: "roleId",
      as: "role",
    });
    // Will associate with repairs, payments, etc later
  };

  return StaffMember;
};
