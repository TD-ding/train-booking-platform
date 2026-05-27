import { Router, Request, Response } from "express";
import { getDb } from "../db/index.js";

const router = Router();

interface SearchRow {
  train_id: number;
  train_number: string;
  train_type: string;
  departure_station_id: number;
  arrival_station_id: number;
  departure_time: string;
  arrival_time: string;
  duration: string;
  status: string;
  created_at: string;
  from_order: number;
  from_dep_time: string;
  to_order: number;
  to_arr_time: string;
  seat_id: number;
  seat_type_id: number;
  from_stop_order: number;
  to_stop_order: number;
  total_seats: number;
  available_seats: number;
  price: number;
  seat_type_name: string;
  seat_type_code: string;
}

const SEARCH_SQL = `
  SELECT
    t.id as train_id, t.train_number, t.train_type, t.departure_station_id, t.arrival_station_id,
    t.departure_time, t.arrival_time, t.duration, t.status, t.created_at,
    fs.stop_order as from_order, fs.departure_time as from_dep_time,
    ts.stop_order as to_order, ts.arrival_time as to_arr_time,
    tse.id as seat_id, tse.seat_type_id, tse.from_stop_order, tse.to_stop_order,
    tse.total_seats, tse.available_seats, tse.price,
    st.name as seat_type_name, st.code as seat_type_code
  FROM train_stops fs
  JOIN train_stops ts ON fs.train_id = ts.train_id AND ts.stop_order > fs.stop_order
  JOIN trains t ON t.id = fs.train_id AND t.status = 'active'
  JOIN train_seats tse ON tse.train_id = t.id
    AND tse.from_stop_order <= fs.stop_order AND tse.to_stop_order >= ts.stop_order
  JOIN seat_types st ON st.id = tse.seat_type_id
  WHERE fs.station_id = ? AND ts.station_id = ?
  ORDER BY t.id, st.id, tse.from_stop_order
`;

router.get("/search", (req: Request, res: Response) => {
  const { from_station_id, to_station_id, date } = req.query;
  if (!from_station_id || !to_station_id) {
    res.status(400).json({ error: "请选择出发站和到达站" });
    return;
  }
  if (from_station_id === to_station_id) {
    res.status(400).json({ error: "出发站和到达站不能相同" });
    return;
  }
  if (date) {
    const today = new Date().toISOString().split("T")[0];
    if (String(date) < today) {
      res.status(400).json({ error: "不能查询过去的日期" });
      return;
    }
  }
  const db = getDb();

  const rows = db.prepare(SEARCH_SQL).all(from_station_id, to_station_id) as SearchRow[];

  const trainMap = new Map<number, {
    train: Record<string, unknown>;
    from_stop: Record<string, unknown>;
    to_stop: Record<string, unknown>;
    seats: Record<string, unknown>[];
    from_station: unknown;
    to_station: unknown;
  }>();

  for (const row of rows) {
    if (!trainMap.has(row.train_id)) {
      trainMap.set(row.train_id, {
        train: {
          id: row.train_id, train_number: row.train_number, train_type: row.train_type,
          departure_station_id: row.departure_station_id, arrival_station_id: row.arrival_station_id,
          departure_time: row.departure_time, arrival_time: row.arrival_time,
          duration: row.duration, status: row.status, created_at: row.created_at,
        },
        from_stop: { train_id: row.train_id, from_order: row.from_order, from_dep_time: row.from_dep_time },
        to_stop: { to_order: row.to_order, to_arr_time: row.to_arr_time },
        seats: [],
        from_station: null,
        to_station: null,
      });
    }

    const entry = trainMap.get(row.train_id)!;
    const existingSeat = entry.seats.find((s) => s.seat_type_id === row.seat_type_id);
    if (!existingSeat) {
      entry.seats.push({
        id: row.seat_id, seat_type_id: row.seat_type_id,
        from_stop_order: row.from_stop_order, to_stop_order: row.to_stop_order,
        total_seats: row.total_seats, available_seats: row.available_seats,
        price: row.price, seat_type_name: row.seat_type_name, seat_type_code: row.seat_type_code,
      });
    } else if (row.available_seats < (existingSeat.available_seats as number)) {
      existingSeat.available_seats = row.available_seats;
      existingSeat.price = row.price;
    }
  }

  const fromStation = db.prepare("SELECT * FROM stations WHERE id = ?").get(from_station_id);
  const toStation = db.prepare("SELECT * FROM stations WHERE id = ?").get(to_station_id);

  const results = Array.from(trainMap.values());
  for (const r of results) {
    r.from_station = fromStation;
    r.to_station = toStation;
  }

  results.sort((a, b) => (a.from_stop.from_dep_time as string).localeCompare(b.from_stop.from_dep_time as string));
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
