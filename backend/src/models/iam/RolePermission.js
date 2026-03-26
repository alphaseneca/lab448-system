import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      roleId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        field: "role_id",
        references: {
          model: "roles",
          key: "id",
        },
      },
      permissionId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        field: "permission_id",
        references: {
          model: "permissions",
          key: "id",
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "role_permissions",
      timestamps: true,
      updatedAt: false, // Disables updated_at
      underscored: true,
    }
  );

  return RolePermission;
};
