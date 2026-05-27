import { Router, Request, Response } from "express";
import { getDb } from "../db/index.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", (_req: Request, res: Response) => {
  const db = getDb();
  const totalOrders = (db.prepare("SELECT COUNT(*) as count FROM bookings").get() as { count: number }).count;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE status IN ('paid', 'completed')").get() as { total: number }).total;
  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as { count: number }).count;
  const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get() as { count: number }).count;
  const todayOrders = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE date(created_at) = date('now')").get() as { count: number }).count;

  const popularRoutes = db.prepare(`
    SELECT fs.name as from_station, ts.name as to_station, COUNT(*) as count
    FROM bookings b
    JOIN stations fs ON b.from_station_id = fs.id
    JOIN stations ts ON b.to_station_id = ts.id
    GROUP BY b.from_station_id, b.to_station_id
    ORDER BY count DESC LIMIT 5
  `).all();

  const recentOrders = db.prepare(`
    SELECT b.*, t.train_number, u.username,
      fs.name as from_station_name, ts.name as to_station_name
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN users u ON b.user_id = u.id
    JOIN stations fs ON b.from_station_id = fs.id
    JOIN stations ts ON b.to_station_id = ts.id
    ORDER BY b.created_at DESC LIMIT 10
  `).all();

  res.json({ totalOrders, totalRevenue, totalUsers, pendingOrders, todayOrders, popularRoutes, recentOrders });
});

router.get("/users", (_req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare("SELECT id, username, real_name, phone, email, role, created_at FROM users ORDER BY id").all();
  res.json(users);
});

router.put("/users/:id/role", (req: Request, res: Response) => {
  const { role } = req.body;
  if (role !== "user" && role !== "admin") {
    res.status(400).json({ error: "无效角色" });
    return;
  }
  const db = getDb();
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  res.json({ message: "更新成功" });
});

router.get("/trains", (_req: Request, res: Response) => {
  const db = getDb();
  const trains = db.prepare(`
    SELECT t.*, s1.name as departure_station_name, s2.name as arrival_station_name
    FROM trains t
    LEFT JOIN stations s1 ON t.departure_station_id = s1.id
    LEFT JOIN stations s2 ON t.arrival_station_id = s2.id
    ORDER BY t.train_number
  `).all();
  res.json(trains);
});

router.post("/trains", (req: Request, res: Response) => {
  const { train_number, train_type, departure_station_id, arrival_station_id, departure_time, arrival_time, duration } = req.body;
  if (!train_number || !train_type) {
    res.status(400).json({ error: "缺少必要参数" });
    return;
  }
  const db = getDb();
  try {
    const result = db.prepare(
      `INSERT INTO trains (train_number, train_type, departure_station_id, arrival_station_id, departure_time, arrival_time, duration, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
    ).run(train_number, train_type, departure_station_id, arrival_station_id, departure_time, arrival_time, duration);
    const train = db.prepare("SELECT * FROM trains WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(train);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      res.status(409).json({ error: "车次号已存在" });
      return;
    }
    throw e;
  }
});

router.put("/trains/:id", (req: Request, res: Response) => {
  const { train_number, train_type, departure_station_id, arrival_station_id, departure_time, arrival_time, duration, status } = req.body;
  const db = getDb();
  db.prepare(
    `UPDATE trains SET train_number=?, train_type=?, departure_station_id=?, arrival_station_id=?,
     departure_time=?, arrival_time=?, duration=?, status=? WHERE id=?`
  ).run(train_number, train_type, departure_station_id, arrival_station_id, departure_time, arrival_time, duration, status, req.params.id);
  const train = db.prepare("SELECT * FROM trains WHERE id = ?").get(req.params.id);
  res.json(train);
});

router.delete("/trains/:id", (req: Request, res: Response) => {
  const db = getDb();
  db.prepare("DELETE FROM train_stops WHERE train_id = ?").run(req.params.id);
  db.prepare("DELETE FROM train_seats WHERE train_id = ?").run(req.params.id);
  db.prepare("DELETE FROM trains WHERE id = ?").run(req.params.id);
  res.json({ message: "删除成功" });
});

router.post("/trains/:id/stops", (req: Request, res: Response) => {
  const { station_id, stop_order, arrival_time, departure_time, stop_duration } = req.body;
  if (!station_id || stop_order === undefined) {
    res.status(400).json({ error: "缺少必要参数" });
    return;
  }
  const db = getDb();
  db.prepare(
    "INSERT INTO train_stops (train_id, station_id, stop_order, arrival_time, departure_time, stop_duration) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(req.params.id, station_id, stop_order, arrival_time || "", departure_time || "", stop_duration || 2);
  res.status(201).json({ message: "添加成功" });
});

router.delete("/trains/:trainId/stops/:stopId", (req: Request, res: Response) => {
  const db = getDb();
  db.prepare("DELETE FROM train_stops WHERE id = ? AND train_id = ?").run(req.params.stopId, req.params.trainId);
  res.json({ message: "删除成功" });
});

router.get("/stations", (_req: Request, res: Response) => {
  const db = getDb();
  const stations = db.prepare("SELECT * FROM stations ORDER BY id").all();
  res.json(stations);
});

router.post("/stations", (req: Request, res: Response) => {
  const { name, code, city, pinyin } = req.body;
  if (!name || !code || !city) {
    res.status(400).json({ error: "缺少必要参数" });
    return;
  }
  const db = getDb();
  try {
    const result = db.prepare("INSERT INTO stations (name, code, city, pinyin) VALUES (?, ?, ?, ?)")
      .run(name, code, city, pinyin || "");
    const station = db.prepare("SELECT * FROM stations WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(station);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      res.status(409).json({ error: "车站编码已存在" });
      return;
    }
    throw e;
  }
});

router.put("/stations/:id", (req: Request, res: Response) => {
  const { name, code, city, pinyin } = req.body;
  const db = getDb();
  db.prepare("UPDATE stations SET name=?, code=?, city=?, pinyin=? WHERE id=?")
    .run(name, code, city, pinyin || "", req.params.id);
  const station = db.prepare("SELECT * FROM stations WHERE id = ?").get(req.params.id);
  res.json(station);
});

router.delete("/stations/:id", (req: Request, res: Response) => {
  const db = getDb();
  db.prepare("DELETE FROM stations WHERE id = ?").run(req.params.id);
  res.json({ message: "删除成功" });
});

router.get("/orders", (req: Request, res: Response) => {
  const { status } = req.query;
  const db = getDb();
  let query = `
    SELECT b.*, t.train_number, u.username, st.name as seat_type_name,
      fs.name as from_station_name, ts.name as to_station_name
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN users u ON b.user_id = u.id
    JOIN seat_types st ON b.seat_type_id = st.id
    JOIN stations fs ON b.from_station_id = fs.id
    JOIN stations ts ON b.to_station_id = ts.id
  `;
  const params: unknown[] = [];
  if (status) {
    query += " WHERE b.status = ?";
    params.push(status);
  }
  query += " ORDER BY b.created_at DESC";
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.post("/orders/:id/refund", (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id) as { id: number; status: string; price: number } | undefined;
  if (!booking) {
    res.status(404).json({ error: "订单不存在" });
    return;
  }
  if (booking.status !== "paid") {
    res.status(400).json({ error: "只能退已支付的订单" });
    return;
  }
  db.prepare("UPDATE bookings SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(booking.id);
  db.prepare("UPDATE payments SET payment_status = 'refunded' WHERE booking_id = ?").run(booking.id);
  res.json({ message: "退票成功" });
});

export default router;
