import { sequelize } from "../models/index.js";
import models from "../models/index.js";

const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      console.error("✗ Refusing to run db:sync in production environment. Use db:migrate instead.");
      process.exit(1);
    }
    
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connection established");

    console.log("\nSyncing database schema...");
    await sequelize.sync();
    console.log("✓ Database schema synced successfully");

    console.log("\nAll models:");
    Object.keys(models).forEach((modelName) => {
      console.log(`  - ${modelName}`);
    });

    console.log("\n✓ Database setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Database sync failed:", error);
    process.exit(1);
  }
};

syncDatabase();
