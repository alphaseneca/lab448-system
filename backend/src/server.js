import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { PORT } from "./config.js";
import models, { sequelize } from "./models/index.js";
import { CHARGE_TYPES } from "./utils/constants.js";

// V2 Fortified Routes
import v2Routes from "./routes/index.js";

const app = express();

// Disable automatic ETag generation for API responses to avoid conditional
// responses (304) which can confuse XHR clients. Also set no-store cache
// headers for API routes.
app.set("etag", false);
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mount all V2 routes
app.use("/api", v2Routes);

// In production (e.g. Docker), serve built frontend from ./public (SPA fallback)
const publicPath = path.join(process.cwd(), "public");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ message: "Unexpected error" });
});

const seedDefaultInvoicingData = async () => {
  await models.ChargeType.findOrCreate({
    where: { code: CHARGE_TYPES.GENERAL_SERVICE.CODE },
    defaults: {
      code: CHARGE_TYPES.GENERAL_SERVICE.CODE,
      name: CHARGE_TYPES.GENERAL_SERVICE.NAME,
      isDiscount: false,
      isTax: false,
      sortOrder: 0,
      isActive: true,
    },
  });
};

// Test database connection and start server
sequelize
  .authenticate()
  .then(async () => {
    console.log("✓ Database connection established");
    await seedDefaultInvoicingData();
    app.listen(PORT, () => {
      console.log(`✓ Repair shop backend listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ Unable to connect to database:", err);
    process.exit(1);
  });

