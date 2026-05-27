import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const secretPath = path.join(__dirname, "../../.secret");

function getJwtSecret(): string {
  const env = process.env.JWT_SECRET;
  if (env) return env;

  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, "utf-8").trim();
  }

  const generated = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  console.log("⚠️  已自动生成 JWT 密钥并保存到 .secret 文件。生产环境请设置环境变量 JWT_SECRET。");
  return generated;
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  jwtSecret: getJwtSecret(),
  jwtExpiresIn: "7d" as const,
  dbPath: process.env.DB_PATH || path.join(__dirname, "../../data/trains.db"),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
