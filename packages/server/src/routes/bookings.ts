import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Database from "better-sqlite3";
import { getDb } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdCard, validatePhone } from "../lib/validate.js";

const router = Router();

function generateSeatNumber(db: Database.Database, trainId: number, seatTypeId: number): string {
  const usedSeats = db.prepare(
    "SELECT seat_number FROM bookings WHERE train_id = ? AND seat_type_id = ? AND status IN ('pending', 'paid', 'completed')"
  ).all(trainId, seatTypeId) as { seat_number: string }[];

  const usedSet = new Set(usedSeats.map((s) => s.seat_number));
  const seatInfo = db.prepare(
    "SELECT st.name as seat_type_name FROM seat_types st WHERE st.id = ?"
  ).get(seatTypeId) as { seat_type_name: string } | undefined;

  const maxCars = seatInfo?.seat_type_name?.includes("商务") ? 3 : seatInfo?.seat_type_name?.includes("卧") ? 10 : 15;
  const maxSeats = seatInfo?.seat_type_name?.includes("商务") ? 12 : seatInfo?.seat_type_name?.includes("卧") ? 36 : 80;

  for (let car = 1; car <= maxCars; car++) {
    for (let seat = 1; seat <= maxSeats; seat++) {
      const seatNum = `${car}车${seat}号`;
      if (!usedSet.has(seatNum)) {
        return seatNum;
      }
    }
  }
  return `${Math.floor(Math.random() * maxCars) + 1}车${Math.floor(Math.random() * maxSeats) + 1}号`;
}

router.post("/", authMiddleware, (req: Request, res: Response) => {
  const { train_id, seat_type_id, from_station_id, to_station_id, passenger_name, passenger_id_card, passenger_phone, payment_method } = req.body;
  if (!train_id || !seat_type_id || !from_station_id || !to_station_id || !passenger_name || !passenger_id_card) {
    res.status(400).json({ error: "缺少必要参数" });
    return;
  }
  const idCardError = validateIdCard(passenger_id_card);
  if (idCardError) {
    res.status(400).json({ error: idCardError });
    return;
  }
  const phoneError = validatePhone(passenger_phone);
  if (phoneError) {
    res.status(400).json({ error: phoneError });
    return;
  }
  const db = getDb();

  let booking: unknown;
  try {
    booking = db.transaction(() => {
      const fromStop = db.prepare(
        "SELECT stop_order FROM train_stops WHERE train_id = ? AND station_id = ?"
      ).get(train_id, from_station_id) as { stop_order: number } | undefined;
      const toStop = db.prepare(
        "SELECT stop_order FROM train_stops WHERE train_id = ? AND station_id = ? AND stop_order > ?"
      ).get(train_id, to_station_id, fromStop?.stop_order ?? 0) as { stop_order: number } | undefined;

      if (!fromStop || !toStop) {
        throw new Error("INVALID_ROUTE");
      }

      const seat = db.prepare(`
        SELECT * FROM train_seats
        WHERE train_id = ? AND seat_type_id = ? AND from_stop_order <= ? AND to_stop_order >= ? AND available_seats > 0
      `).get(train_id, seat_type_id, fromStop.stop_order, toStop.stop_order) as { id: number; price: number; available_seats: number } | undefined;

      if (!seat) {
        throw new Error("SOLD_OUT");
      }

      db.prepare("UPDATE train_seats SET available_seats = available_seats - 1 WHERE id = ?").run(seat.id);

      const seatNumber = generateSeatNumber(db, train_id, seat_type_id);
      const orderNumber = `TB${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const bookingResult = db.prepare(`
        INSERT INTO bookings (user_id, train_id, seat_type_id, from_station_id, to_station_id,
          passenger_name, passenger_id_card, passenger_phone, seat_number, price, status, order_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(req.user!.userId, train_id, seat_type_id, from_station_id, to_station_id,
        passenger_name, passenger_id_card, passenger_phone || "", seatNumber, seat.price, orderNumber);

      db.prepare(`
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id)
        VALUES (?, ?, ?, 'pending', ?)
      `).run(bookingResult.lastInsertRowid, seat.price, payment_method || "wechat", uuidv4());

      return db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingResult.lastInsertRowid);
    })();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "预订失败";
    if (msg === "SOLD_OUT") {
      res.status(400).json({ error: "该座位类型已售罄" });
    } else if (msg === "INVALID_ROUTE") {
      res.status(400).json({ error: "车次不经过所选车站" });
    } else {
      res.status(500).json({ error: "预订失败，请稍后重试" });
    }
    return;
  }

  res.status(201).json(booking);
});

router.post("/:id/pay", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = 'pending'")
    .get(req.params.id, req.user!.userId) as { id: number } | undefined;
  if (!booking) {
    res.status(404).json({ error: "订单不存在或状态不可支付" });
    return;
  }

  db.prepare("UPDATE bookings SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(booking.id);
  db.prepare("UPDATE payments SET payment_status = 'success', paid_at = CURRENT_TIMESTAMP WHERE booking_id = ?")
    .run(booking.id);

  const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id);
  res.json(updated);
});

function releaseSeat(db: Database.Database, bookingId: number): void {
  const fromStop = db.prepare(`
    SELECT ts.stop_order FROM bookings b
    JOIN train_stops ts ON ts.train_id = b.train_id AND ts.station_id = b.from_station_id
    WHERE b.id = ?
  `).get(bookingId) as { stop_order: number } | undefined;
  const toStop = db.prepare(`
    SELECT ts.stop_order FROM bookings b
    JOIN train_stops ts ON ts.train_id = b.train_id AND ts.station_id = b.to_station_id
    WHERE b.id = ?
  `).get(bookingId) as { stop_order: number } | undefined;

  if (fromStop && toStop) {
    db.prepare(`
      UPDATE train_seats SET available_seats = available_seats + 1
      WHERE train_id = (SELECT train_id FROM bookings WHERE id = ?)
      AND seat_type_id = (SELECT seat_type_id FROM bookings WHERE id = ?)
      AND from_stop_order <= ? AND to_stop_order >= ?
    `).run(bookingId, bookingId, fromStop.stop_order, toStop.stop_order);
  }
}

router.post("/:id/cancel", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user!.userId) as { id: number; status: string } | undefined;
  if (!booking) {
    res.status(404).json({ error: "订单不存在" });
    return;
  }
  if (booking.status !== "pending" && booking.status !== "paid") {
    res.status(400).json({ error: "订单状态不可取消" });
    return;
  }

  const wasPaid = booking.status === "paid";
  db.prepare("UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(booking.id);

  if (wasPaid) {
    db.prepare("UPDATE payments SET payment_status = 'refunded' WHERE booking_id = ?").run(booking.id);
    releaseSeat(db, booking.id);
  } else {
    releaseSeat(db, booking.id);
  }

  const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id);
  res.json(updated);
});

router.get("/my", authMiddleware, (req: Request, res: Response) => {
  const { status } = req.query;
  const db = getDb();
  let query = `
    SELECT b.*, t.train_number, t.train_type, t.departure_time, t.arrival_time, t.duration,
      st.name as seat_type_name,
      fs.name as from_station_name, ts.name as to_station_name
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN seat_types st ON b.seat_type_id = st.id
    JOIN stations fs ON b.from_station_id = fs.id
    JOIN stations ts ON b.to_station_id = ts.id
    WHERE b.user_id = ?
  `;
  const params: unknown[] = [req.user!.userId];
  if (status) {
    query += " AND b.status = ?";
    params.push(status);
  }
  query += " ORDER BY b.created_at DESC";
  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

router.get("/:id", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*, t.train_number, t.train_type, t.departure_time, t.arrival_time, t.duration,
      st.name as seat_type_name,
      fs.name as from_station_name, ts.name as to_station_name,
      p.payment_method, p.payment_status, p.paid_at
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN seat_types st ON b.seat_type_id = st.id
    JOIN stations fs ON b.from_station_id = fs.id
    JOIN stations ts ON b.to_station_id = ts.id
    LEFT JOIN payments p ON p.booking_id = b.id
    WHERE b.id = ? AND b.user_id = ?
  `).get(req.params.id, req.user!.userId);
  if (!booking) {
    res.status(404).json({ error: "订单不存在" });
    return;
  }
  res.json(booking);
});

export default router;
