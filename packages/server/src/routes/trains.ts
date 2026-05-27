import { Router, Request, Response } from "express";
import { getDb } from "../db/index.js";

const router = Router();

router.get("/search", (req: Request, res: Response) => {
  const { from_station_id, to_station_id } = req.query;
  if (!from_station_id || !to_station_id) {
    res.status(400).json({ error: "请选择出发站和到达站" });
    return;
  }
  const db = getDb();

  const fromStops = db.prepare(
    "SELECT train_id, stop_order as from_order, departure_time as from_dep_time FROM train_stops WHERE station_id = ?"
  ).all(from_station_id) as { train_id: number; from_order: number; from_dep_time: string }[];

  const results = [];
  for (const fromStop of fromStops) {
    const toStop = db.prepare(
      "SELECT stop_order as to_order, arrival_time as to_arr_time FROM train_stops WHERE train_id = ? AND station_id = ? AND stop_order > ?"
    ).get(fromStop.train_id, to_station_id, fromStop.from_order) as { to_order: number; to_arr_time: string } | undefined;

    if (!toStop) continue;

    const train = db.prepare("SELECT * FROM trains WHERE id = ? AND status = 'active'").get(fromStop.train_id);
    if (!train) continue;

    const seats = db.prepare(`
      SELECT ts.*, st.name as seat_type_name, st.code as seat_type_code
      FROM train_seats ts
      JOIN seat_types st ON ts.seat_type_id = st.id
      WHERE ts.train_id = ? AND ts.from_stop_order <= ? AND ts.to_stop_order >= ?
      ORDER BY st.id
    `).all(fromStop.train_id, fromStop.from_order, toStop.to_order) as Record<string, unknown>[];

    const fromStation = db.prepare("SELECT * FROM stations WHERE id = ?").get(from_station_id);
    const toStation = db.prepare("SELECT * FROM stations WHERE id = ?").get(to_station_id);

    const minSeatsByType = new Map<number, { seats: Record<string, unknown>; minAvail: number }>();
    for (const seat of seats) {
      const typeId = seat.seat_type_id as number;
      const avail = seat.available_seats as number;
      if (!minSeatsByType.has(typeId) || avail < minSeatsByType.get(typeId)!.minAvail) {
        minSeatsByType.set(typeId, { seats: seat, minAvail: avail });
      }
    }

    const uniqueSeats = Array.from(minSeatsByType.values()).map((v) => v.seats);

    results.push({ train, from_stop: fromStop, to_stop: toStop, seats: uniqueSeats, from_station: fromStation, to_station: toStation });
  }

  results.sort((a, b) => (a.from_stop as { from_dep_time: string }).from_dep_time.localeCompare((b.from_stop as { from_dep_time: string }).from_dep_time));
  res.json(results);
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const train = db.prepare("SELECT * FROM trains WHERE id = ?").get(req.params.id);
  if (!train) {
    res.status(404).json({ error: "车次不存在" });
    return;
  }
  const stops = db.prepare(`
    SELECT ts.*, s.name as station_name, s.city, s.code as station_code
    FROM train_stops ts
    JOIN stations s ON ts.station_id = s.id
    WHERE ts.train_id = ?
    ORDER BY ts.stop_order
  `).all(req.params.id);

  const seats = db.prepare(`
    SELECT tse.*, st.name as seat_type_name, st.code as seat_type_code
    FROM train_seats tse
    JOIN seat_types st ON tse.seat_type_id = st.id
    WHERE tse.train_id = ?
    ORDER BY st.id, tse.from_stop_order
  `).all(req.params.id);

  res.json({ train, stops, seats });
});

router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const trains = db.prepare("SELECT * FROM trains ORDER BY train_number").all();
  res.json(trains);
});

export default router;
