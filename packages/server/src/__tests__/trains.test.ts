import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { setupTestDb, teardownTestDb, request } from "./helpers.js";

beforeAll(setupTestDb);
afterAll(teardownTestDb);

describe("GET /api/trains/search", () => {
  it("returns search results for valid route", async () => {
    const res = await request().get("/api/trains/search?from_station_id=1&to_station_id=3");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0].train).toBeDefined();
      expect(res.body[0].seats).toBeDefined();
    }
  });

  it("rejects missing station params", async () => {
    const res = await request().get("/api/trains/search");
    expect(res.status).toBe(400);
  });

  it("rejects same origin and destination", async () => {
    const res = await request().get("/api/trains/search?from_station_id=1&to_station_id=1");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/相同/);
  });

  it("rejects past dates", async () => {
    const pastDate = "2020-01-01";
    const res = await request().get(`/api/trains/search?from_station_id=1&to_station_id=3&date=${pastDate}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/过去/);
  });

  it("allows today and future dates", async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await request().get(`/api/trains/search?from_station_id=1&to_station_id=3&date=${today}`);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/trains/:id", () => {
  it("returns train detail with stops and seats", async () => {
    const res = await request().get("/api/trains/1");
    expect(res.status).toBe(200);
    expect(res.body.train).toBeDefined();
    expect(res.body.stops).toBeDefined();
    expect(res.body.seats).toBeDefined();
  });

  it("returns 404 for nonexistent train", async () => {
    const res = await request().get("/api/trains/99999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/stations", () => {
  it("returns list of stations", async () => {
    const res = await request().get("/api/stations");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("GET /api/stations/search", () => {
  it("searches stations by keyword", async () => {
    const res = await request().get("/api/stations/search?q=北京");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toContain("北京");
  });

  it("returns empty for no query", async () => {
    const res = await request().get("/api/stations/search");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
