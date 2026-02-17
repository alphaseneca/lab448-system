/**
 * Sequelize CLI config for migrations (use_env_variable + dialect).
 * The app uses the same DATABASE_URL via src/models/index.js (sequelize instance).
 */
require("dotenv").config();

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
  },
};
