import { config } from "./config/index.js";
import { getDb, closeDb } from "./db/index.js";
import { runMigrations } from "./db/migrations/init.js";
import { seedData } from "./db/seed/index.js";
import { createApp } from "./app.js";

getDb();
runMigrations();
seedData();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚄 火车票订购平台后端服务运行在 http://localhost:${config.port}`);
});

process.on("SIGINT", () => {
  server.close();
  closeDb();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close();
  closeDb();
  process.exit(0);
});
