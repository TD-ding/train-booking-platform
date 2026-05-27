import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { setupTestDb, teardownTestDb, request, loginUser, loginAdmin, authHeader } from "./helpers.js";

beforeAll(setupTestDb);
afterAll(teardownTestDb);

describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const res = await request().post("/api/auth/register").send({
      username: "newuser",
      password: "password123",
      real_name: "测试用户",
      phone: "13600136000",
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe("newuser");
    expect(res.body.user.role).toBe("user");
  });

  it("rejects duplicate username", async () => {
    const res = await request().post("/api/auth/register").send({
      username: "zhangsan",
      password: "password123",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it("rejects missing username or password", async () => {
    const res1 = await request().post("/api/auth/register").send({ password: "123456" });
    expect(res1.status).toBe(400);

    const res2 = await request().post("/api/auth/register").send({ username: "testuser" });
    expect(res2.status).toBe(400);
  });

  it("rejects short username", async () => {
    const res = await request().post("/api/auth/register").send({ username: "a", password: "123456" });
    expect(res.status).toBe(400);
  });

  it("rejects short password", async () => {
    const res = await request().post("/api/auth/register").send({ username: "validuser", password: "12345" });
    expect(res.status).toBe(400);
  });

  it("rejects invalid phone", async () => {
    const res = await request().post("/api/auth/register").send({
      username: "phoneuser",
      password: "123456",
      phone: "123",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await request().post("/api/auth/login").send({
      username: "zhangsan",
      password: "123456",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe("zhangsan");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects wrong password", async () => {
    const res = await request().post("/api/auth/login").send({
      username: "zhangsan",
      password: "wrong",
    });
    expect(res.status).toBe(401);
  });

  it("rejects nonexistent user", async () => {
    const res = await request().post("/api/auth/login").send({
      username: "nonexistent",
      password: "123456",
    });
    expect(res.status).toBe(401);
  });

  it("rejects missing fields", async () => {
    const res = await request().post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns user info with valid token", async () => {
    const token = await loginUser();
    const res = await request().get("/api/auth/me").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("zhangsan");
  });

  it("rejects request without token", async () => {
    const res = await request().get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const res = await request().get("/api/auth/me").set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/auth/change-password", () => {
  it("changes password successfully", async () => {
    // Register a user specifically for this test
    await request().post("/api/auth/register").send({
      username: "pwuser",
      password: "oldpass123",
    });
    const token = await loginUser("pwuser", "oldpass123");

    const res = await request().put("/api/auth/change-password").set(authHeader(token)).send({
      old_password: "oldpass123",
      new_password: "newpass123",
      confirm_password: "newpass123",
    });
    expect(res.status).toBe(200);
  });

  it("rejects wrong old password", async () => {
    await request().post("/api/auth/register").send({
      username: "pwuser2",
      password: "pass123456",
    });
    const token = await loginUser("pwuser2", "pass123456");

    const res = await request().put("/api/auth/change-password").set(authHeader(token)).send({
      old_password: "wrongpass",
      new_password: "newpass123",
      confirm_password: "newpass123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects short new password", async () => {
    const token = await loginAdmin();
    const res = await request().put("/api/auth/change-password").set(authHeader(token)).send({
      old_password: "admin123",
      new_password: "123",
      confirm_password: "123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects without auth", async () => {
    const res = await request().put("/api/auth/change-password").send({
      old_password: "old",
      new_password: "newpass123",
    });
    expect(res.status).toBe(401);
  });
});
