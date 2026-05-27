import { Router, Request, Response } from "express";
import { getDb } from "../db/index.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const stations = db.prepare("SELECT * FROM stations ORDER BY pinyin").all();
  res.json(stations);
});

router.get("/search", (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) {
    res.json([]);
    return;
  }
  const db = getDb();
  const stations = db.prepare(
    "SELECT * FROM stations WHERE name LIKE ? OR pinyin LIKE ? OR city LIKE ? ORDER BY pinyin LIMIT 20"
  ).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(stations);
});

export default router;
