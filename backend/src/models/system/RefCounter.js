import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RefCounter = sequelize.define(
    "RefCounter",
    {
      counterType: {
        type: DataTypes.STRING,
        primaryKey: true,
        field: "counter_type",
      },
      prefix: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "last_value",
      },
      padLength: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 4,
        field: "pad_length",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
    },
    {
      tableName: "ref_counters",
      timestamps: true,
      createdAt: false,
      underscored: true,
    }
  );

  return RefCounter;
};
