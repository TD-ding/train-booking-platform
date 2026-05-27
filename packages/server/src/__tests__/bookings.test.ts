import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { setupTestDb, teardownTestDb, request, loginUser, authHeader } from "./helpers.js";

beforeAll(setupTestDb);
afterAll(teardownTestDb);

async function getAvailableSeat() {
  const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
  if (searchRes.body.length === 0) return null;
  const seats = searchRes.body[0].seats;
  const available = seats.find((s: Record<string, unknown>) => (s.available_seats as number) > 0);
  return available || null;
}

describe("POST /api/bookings", () => {
  it("creates a booking successfully", async () => {
    const token = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return; // no available seats in seed data

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const res = await request().post("/api/bookings").set(authHeader(token)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "测试乘客",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
      payment_method: "wechat",
    });

    expect(res.status).toBe(201);
    expect(res.body.order_number).toBeDefined();
    expect(res.body.status).toBe("pending");
    expect(res.body.seat_number).toBeDefined();
    expect(res.body.price).toBeGreaterThan(0);
  });

  it("rejects without auth", async () => {
    const res = await request().post("/api/bookings").send({});
    expect(res.status).toBe(401);
  });

  it("rejects missing required fields", async () => {
    const token = await loginUser();
    const res = await request().post("/api/bookings").set(authHeader(token)).send({
      passenger_name: "测试",
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid id_card", async () => {
    const token = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const res = await request().post("/api/bookings").set(authHeader(token)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "测试",
      passenger_id_card: "123",
      passenger_phone: "13800138000",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/bookings/:id/pay", () => {
  it("pays a pending booking", async () => {
    const token = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const bookingRes = await request().post("/api/bookings").set(authHeader(token)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "支付测试",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });

    const res = await request().post(`/api/bookings/${bookingRes.body.id}/pay`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("paid");
  });

  it("rejects paying another user's booking", async () => {
    // Login as zhangsan, create booking
    const token1 = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const bookingRes = await request().post("/api/bookings").set(authHeader(token1)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "张三的票",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });

    // Login as lisi, try to pay zhangsan's booking
    const token2 = await loginUser("lisi", "123456");
    const res = await request().post(`/api/bookings/${bookingRes.body.id}/pay`).set(authHeader(token2));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/bookings/:id/cancel", () => {
  it("cancels a pending booking and releases seat", async () => {
    const token = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const bookingRes = await request().post("/api/bookings").set(authHeader(token)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "取消测试",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });

    const res = await request().post(`/api/bookings/${bookingRes.body.id}/cancel`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });

  it("cancels a paid booking", async () => {
    const token = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const bookingRes = await request().post("/api/bookings").set(authHeader(token)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "取消已付",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });
    await request().post(`/api/bookings/${bookingRes.body.id}/pay`).set(authHeader(token));

    const res = await request().post(`/api/bookings/${bookingRes.body.id}/cancel`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });
});

describe("GET /api/bookings/my", () => {
  it("returns user's bookings", async () => {
    const token = await loginUser();
    const res = await request().get("/api/bookings/my").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("filters by status", async () => {
    const token = await loginUser();
    const res = await request().get("/api/bookings/my?status=pending").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const b of res.body) {
      expect(b.status).toBe("pending");
    }
  });
});

describe("GET /api/bookings/:id", () => {
  it("returns booking detail", async () => {
    const token = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const bookingRes = await request().post("/api/bookings").set(authHeader(token)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "详情测试",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });

    const res = await request().get(`/api/bookings/${bookingRes.body.id}`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.train_number).toBeDefined();
    expect(res.body.from_station_name).toBeDefined();
  });

  it("rejects accessing other user's booking", async () => {
    const token1 = await loginUser();
    const seat = await getAvailableSeat();
    if (!seat) return;

    const searchRes = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    const trainId = searchRes.body[0].train.id;

    const bookingRes = await request().post("/api/bookings").set(authHeader(token1)).send({
      train_id: trainId,
      seat_type_id: seat.seat_type_id,
      from_station_id: 1,
      to_station_id: 3,
      passenger_name: "张三的票",
      passenger_id_card: "110101199001011237",
      passenger_phone: "13800138000",
    });

    const token2 = await loginUser("lisi", "123456");
    const res = await request().get(`/api/bookings/${bookingRes.body.id}`).set(authHeader(token2));
    expect(res.status).toBe(404);
  });
});
