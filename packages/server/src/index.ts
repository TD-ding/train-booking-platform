import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { getDb, closeDb } from "./db/index.js";
import { runMigrations } from "./db/migrations/init.js";
import { seedData } from "./db/seed/index.js";
import authRoutes from "./routes/auth.js";
import stationRoutes from "./routes/stations.js";
import trainRoutes from "./routes/trains.js";
import bookingRoutes from "./routes/bookings.js";
import contactRoutes from "./routes/contacts.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

getDb();
runMigrations();
seedData();

app.use("/api/auth", authRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚄 火车票订购平台后端服务运行在 http://localhost:${config.port}`);
});

process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});

