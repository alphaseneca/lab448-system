import { DataTypes } from "sequelize";
import { createId } from "@paralleldrive/cuid2";

export default (sequelize) => {
  const MediaAttachment = sequelize.define(
    "MediaAttachment",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => createId(),
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "entity_type",
      },
      entityId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "entity_id",
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "file_name",
      },
      fileUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "file_url",
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "file_type",
      },
      fileSizeBytes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "file_size_bytes",
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      uploadedById: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "uploaded_by_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
    },
    {
      tableName: "media_attachments",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  MediaAttachment.associate = (models) => {
    MediaAttachment.belongsTo(models.StaffMember, {
      foreignKey: "uploadedById",
      as: "uploadedBy",
    });
    // Entity links (customer_device, repair_order, etc.) are usually generic / polymorphic, 
    // so explicit model associations will only be added where strictly queried as relational ends,
    // or loaded via scopes/hooks.
  };

  return MediaAttachment;
};
