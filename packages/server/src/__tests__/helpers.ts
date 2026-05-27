import supertest, { Agent } from "supertest";
import { config } from "../config/index.js";
import { getDb, closeDb } from "../db/index.js";
import { runMigrations } from "../db/migrations/init.js";
import { seedData } from "../db/seed/index.js";
import { createApp } from "../app.js";

let currentRequest: Agent;

export function setupTestDb(): void {
  closeDb();
  (config as Record<string, unknown>).dbPath = ":memory:";
  getDb();
  runMigrations();
  seedData();
  const app = createApp();
  currentRequest = supertest(app);
}

export function teardownTestDb(): void {
  closeDb();
}

export function request(): Agent {
  return currentRequest;
}

export async function loginAdmin(): Promise<string> {
  const res = await request().post("/api/auth/login").send({ username: "admin", password: "admin123" });
  return res.body.token;
}

export async function loginUser(username = "zhangsan", password = "123456"): Promise<string> {
  const res = await request().post("/api/auth/login").send({ username, password });
  return res.body.token;
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
