import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { setupTestDb, teardownTestDb, request, loginUser, loginAdmin, authHeader } from "./helpers.js";

beforeAll(setupTestDb);
afterAll(teardownTestDb);

describe("Admin access control", () => {
  it("allows admin to access dashboard", async () => {
    const token = await loginAdmin();
    const res = await request().get("/api/admin/dashboard").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.totalOrders).toBeDefined();
    expect(res.body.totalRevenue).toBeDefined();
    expect(res.body.totalUsers).toBeDefined();
  });

  it("forbids regular user from dashboard", async () => {
    const token = await loginUser();
    const res = await request().get("/api/admin/dashboard").set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it("forbids unauthenticated access", async () => {
    const res = await request().get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users", () => {
  it("returns user list for admin", async () => {
    const token = await loginAdmin();
    const res = await request().get("/api/admin/users").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("forbids regular user", async () => {
    const token = await loginUser();
    const res = await request().get("/api/admin/users").set(authHeader(token));
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/admin/users/:id/role", () => {
  it("updates user role", async () => {
    const token = await loginAdmin();
    // Get user list to find a user
    const usersRes = await request().get("/api/admin/users").set(authHeader(token));
    const user = usersRes.body.find((u: Record<string, unknown>) => u.role === "user");

    const res = await request().put(`/api/admin/users/${user.id}/role`).set(authHeader(token)).send({ role: "admin" });
    expect(res.status).toBe(200);
  });

  it("rejects invalid role", async () => {
    const token = await loginAdmin();
    const res = await request().put("/api/admin/users/1/role").set(authHeader(token)).send({ role: "superadmin" });
    expect(res.status).toBe(400);
  });
});

describe("Admin train management", () => {
  it("creates a train", async () => {
    const token = await loginAdmin();
    const res = await request().post("/api/admin/trains").set(authHeader(token)).send({
      train_number: "TEST001",
      train_type: "高铁",
      departure_station_id: 1,
      arrival_station_id: 3,
      departure_time: "08:00",
      arrival_time: "12:00",
      duration: "4小时",
      status: "active",
    });
    expect(res.status).toBe(201);
    expect(res.body.train_number).toBe("TEST001");
  });

  it("rejects duplicate train number", async () => {
    const token = await loginAdmin();
    const trainData = {
      train_number: "DUP001",
      train_type: "高铁",
      departure_station_id: 1,
      arrival_station_id: 3,
      departure_time: "08:00",
      arrival_time: "12:00",
      duration: "4小时",
      status: "active",
    };
    await request().post("/api/admin/trains").set(authHeader(token)).send(trainData);
    const res = await request().post("/api/admin/trains").set(authHeader(token)).send(trainData);
    expect(res.status).toBe(409);
  });

  it("updates a train", async () => {
    const token = await loginAdmin();
    const trainsRes = await request().get("/api/admin/trains").set(authHeader(token));
    const train = trainsRes.body[0];

    const res = await request().put(`/api/admin/trains/${train.id}`).set(authHeader(token)).send({
      ...train,
      train_type: "动车",
    });
    expect(res.status).toBe(200);
  });

  it("deletes a train without active orders", async () => {
    const token = await loginAdmin();
    const createRes = await request().post("/api/admin/trains").set(authHeader(token)).send({
      train_number: "DEL001",
      train_type: "普快",
      departure_station_id: 1,
      arrival_station_id: 2,
      departure_time: "10:00",
      arrival_time: "14:00",
      duration: "4小时",
      status: "active",
    });

    const res = await request().delete(`/api/admin/trains/${createRes.body.id}`).set(authHeader(token));
    expect(res.status).toBe(200);
  });
});

describe("Admin station management", () => {
  it("creates and lists stations", async () => {
    const token = await loginAdmin();
    const res = await request().post("/api/admin/stations").set(authHeader(token)).send({
      name: "测试站",
      code: "TEST1",
      city: "测试市",
      pinyin: "ceshizhan",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("测试站");
  });

  it("rejects duplicate station code", async () => {
    const token = await loginAdmin();
    await request().post("/api/admin/stations").set(authHeader(token)).send({
      name: "站A",
      code: "DUPCODE",
      city: "城市",
    });
    const res = await request().post("/api/admin/stations").set(authHeader(token)).send({
      name: "站B",
      code: "DUPCODE",
      city: "城市",
    });
    expect(res.status).toBe(409);
  });
});

describe("Admin order refund", () => {
  it("refunds a paid order", async () => {
    const token = await loginAdmin();

    // Create a booking as regular user
    const userToken = await loginUser();
    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    if (searchRes.body.length === 0) return;
    const trainId = searchRes.body[0].train.id;
    const seat = searchRes.body[0].seats.find((s: Record<string, unknown>) => (s.available_seats as number) > 0);
    if (!seat) return;

    const bookingRes = await request().post("/api/bookings").set(authHeader(userToken)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "退票测试",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });
    await request().post(`/api/bookings/${bookingRes.body.id}/pay`).set(authHeader(userToken));

    // Admin refunds it
    const res = await request().post(`/api/admin/orders/${bookingRes.body.id}/refund`).set(authHeader(token));
    expect(res.status).toBe(200);
  });

  it("rejects refunding non-paid order", async () => {
    const token = await loginAdmin();
    const userToken = await loginUser();
    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    if (searchRes.body.length === 0) return;
    const trainId = searchRes.body[0].train.id;
    const seat = searchRes.body[0].seats.find((s: Record<string, unknown>) => (s.available_seats as number) > 0);
    if (!seat) return;

    const bookingRes = await request().post("/api/bookings").set(authHeader(userToken)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "退票测试2",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });

    const res = await request().post(`/api/admin/orders/${bookingRes.body.id}/refund`).set(authHeader(token));
    expect(res.status).toBe(400);
  });
});
