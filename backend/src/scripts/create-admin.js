/**
 * Create the first admin user from the command line.
 * Run inside the Docker container:
 *   docker compose exec backend node src/scripts/create-admin.js <email> <password> <name>
 * Example:
 *   docker compose exec backend node src/scripts/create-admin.js admin@lab448.com AdminPass123 "Admin User"
 *
 * Requires ADMIN_SETUP_SECRET env var set to the Postgres password.
 */
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import db, { sequelize } from "../models/index.js";
import { DATABASE_URL } from "../config.js";

const [email, password, name] = process.argv.slice(2);
if (!email || !password || !name) {
  console.error("Usage: node src/scripts/create-admin.js <email> <password> <name>");
  console.error('Example: node src/scripts/create-admin.js admin@lab448.com AdminPass123 "Admin User"');
  process.exit(1);
}

if (!process.env.ADMIN_SETUP_SECRET) {
  console.error("Error: ADMIN_SETUP_SECRET environment variable is missing.");
  console.error("Set it to the Postgres password to authorise this script.");
  process.exit(1);
}

// Verify secret against the DB password embedded in DATABASE_URL
let expectedSecret = process.env.DB_PASSWORD;
if (!expectedSecret && DATABASE_URL) {
  try {
    const url = new URL(DATABASE_URL);
    expectedSecret = url.password;
  } catch (e) {}
}

if (expectedSecret && process.env.ADMIN_SETUP_SECRET !== expectedSecret) {
  console.error("Error: ADMIN_SETUP_SECRET does not match the database password.");
  process.exit(1);
}

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connected");

    // Ensure the ADMIN role exists
    let adminRole = await db.Role.findOne({
      where: { [Op.or]: [{ code: "ADMIN" }, { name: "HQ Access" }] },
    });

    if (!adminRole) {
      console.log("Creating ADMIN role...");
      adminRole = await db.Role.create({
        code: "ADMIN",
        name: "HQ Access",
        description: "Full system access and configuration",
      });
    }
    console.log("✓ Admin role ready:", adminRole.id);

    // Check for existing staff member
    const existing = await db.StaffMember.findOne({ where: { email } });
    if (existing) {
      console.error("✗ A staff member with this email already exists:", email);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.StaffMember.create({
      email,
      passwordHash,
      name,
      roleId: adminRole.id,
      isActive: true,
    });

    console.log("✓ Admin created successfully:");
    console.log("  Email:", user.email);
    console.log("  Name: ", user.name);
    console.log("  ID:   ", user.id);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

createAdmin();
