/**
 * Migration: add google_maps_pin to customer_addresses
 * Run this once against the live database to add the column.
 *
 * Usage (inside the backend container or directly):
 *   node src/scripts/add-google-maps-pin.js
 */
import { sequelize } from "../models/index.js";
import { QueryTypes } from "sequelize";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("✓ Connected to database");

    // Check if column already exists
    const [rows] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'customer_addresses' AND column_name = 'google_maps_pin'`,
      { type: QueryTypes.SELECT }
    );

    if (rows) {
      console.log("✓ Column google_maps_pin already exists — skipping.");
    } else {
      await sequelize.query(
        `ALTER TABLE customer_addresses
         ADD COLUMN google_maps_pin TEXT DEFAULT NULL`
      );
      console.log("✓ Added column google_maps_pin to customer_addresses");
    }

    process.exit(0);
  } catch (err) {
    console.error("✗ Migration failed:", err);
    process.exit(1);
  }
}

run();
