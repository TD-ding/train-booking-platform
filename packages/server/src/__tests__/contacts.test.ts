import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { setupTestDb, teardownTestDb, request, loginUser, authHeader } from "./helpers.js";

beforeAll(setupTestDb);
afterAll(teardownTestDb);

describe("GET /api/contacts", () => {
  it("returns empty list for user with no contacts", async () => {
    const token = await loginUser();
    const res = await request().get("/api/contacts").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("requires authentication", async () => {
    const res = await request().get("/api/contacts");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/contacts", () => {
  it("creates a contact successfully", async () => {
    const token = await loginUser();
    const res = await request().post("/api/contacts").set(authHeader(token)).send({
      name: "测试联系人",
      id_card: "110101199001011237",
      phone: "13800138001",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("测试联系人");
    expect(res.body.id_card).toBe("110101199001011237");
  });

  it("rejects missing name or id_card", async () => {
    const token = await loginUser();
    const res = await request().post("/api/contacts").set(authHeader(token)).send({
      name: "测试",
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid id_card", async () => {
    const token = await loginUser();
    const res = await request().post("/api/contacts").set(authHeader(token)).send({
      name: "测试",
      id_card: "123",
    });
    expect(res.status).toBe(400);
  });

  it("sets default contact correctly", async () => {
    // Use a different user to avoid shared state
    await request().post("/api/auth/register").send({
      username: "contactuser",
      password: "password123",
    });
    const uniqueToken = await loginUser("contactuser", "password123");

    await request().post("/api/contacts").set(authHeader(uniqueToken)).send({
      name: "默认联系人",
      id_card: "110101199001011237",
      is_default: true,
    });

    const res = await request().get("/api/contacts").set(authHeader(uniqueToken));
    expect(res.body).toHaveLength(1);
    expect(res.body[0].is_default).toBe(1);
  });
});

describe("PUT /api/contacts/:id", () => {
  it("updates a contact", async () => {
    const token = await loginUser();
    const createRes = await request().post("/api/contacts").set(authHeader(token)).send({
      name: "原始名",
      id_card: "110101199001011237",
      phone: "13800138001",
    });

    const res = await request().put(`/api/contacts/${createRes.body.id}`).set(authHeader(token)).send({
      name: "更新名",
      id_card: "110101199001011237",
      phone: "13800138002",
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("更新名");
  });

  it("rejects updating another user's contact", async () => {
    const token = await loginUser();
    const res = await request().put("/api/contacts/9999").set(authHeader(token)).send({
      name: "测试",
      id_card: "110101199001011237",
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/contacts/:id", () => {
  it("deletes a contact", async () => {
    const token = await loginUser();
    const createRes = await request().post("/api/contacts").set(authHeader(token)).send({
      name: "待删除",
      id_card: "110101199001011237",
    });

    const res = await request().delete(`/api/contacts/${createRes.body.id}`).set(authHeader(token));
    expect(res.status).toBe(200);
  });

  it("returns 404 for nonexistent contact", async () => {
    const token = await loginUser();
    const res = await request().delete("/api/contacts/9999").set(authHeader(token));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/contacts/batch", () => {
  it("imports multiple contacts", async () => {
    const token = await loginUser();
    const res = await request().post("/api/contacts/batch").set(authHeader(token)).send({
      contacts: [
        { name: "批量1", id_card: "110101199001011237", phone: "13800138001" },
        { name: "批量2", id_card: "32010219900101234X", phone: "13800138002" },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.imported).toBe(2);
    expect(res.body.errors).toHaveLength(0);
    expect(res.body.total).toBe(2);
  });

  it("reports per-row errors for invalid data", async () => {
    const token = await loginUser();
    const res = await request().post("/api/contacts/batch").set(authHeader(token)).send({
      contacts: [
        { name: "有效", id_card: "110101199001011237" },
        { name: "", id_card: "" },
        { name: "无效身份证", id_card: "123" },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.imported).toBe(1);
    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors[0].row).toBe(2);
    expect(res.body.errors[1].row).toBe(3);
  });

  it("rejects empty list", async () => {
    const token = await loginUser();
    const res = await request().post("/api/contacts/batch").set(authHeader(token)).send({
      contacts: [],
    });
    expect(res.status).toBe(400);
  });

  it("rejects more than 50 contacts", async () => {
    const token = await loginUser();
    const contacts = Array.from({ length: 51 }, (_, i) => ({
      name: `用户${i}`,
      id_card: "110101199001011237",
    }));
    const res = await request().post("/api/contacts/batch").set(authHeader(token)).send({ contacts });
    expect(res.status).toBe(400);
  });
});
