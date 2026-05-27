import { Router, Request, Response } from "express";
import { getDb } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdCard, validatePhone } from "../lib/validate.js";

const router = Router();

router.get("/", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const contacts = db.prepare("SELECT * FROM contacts WHERE user_id = ? ORDER BY is_default DESC, id").all(req.user!.userId);
  res.json(contacts);
});

router.post("/", authMiddleware, (req: Request, res: Response) => {
  const { name, id_card, phone, is_default } = req.body;
  if (!name || !id_card) {
    res.status(400).json({ error: "姓名和身份证号不能为空" });
    return;
  }
  const idCardError = validateIdCard(id_card);
  if (idCardError) {
    res.status(400).json({ error: idCardError });
    return;
  }
  const phoneError = validatePhone(phone);
  if (phoneError) {
    res.status(400).json({ error: phoneError });
    return;
  }
  const db = getDb();
  if (is_default) {
    db.prepare("UPDATE contacts SET is_default = 0 WHERE user_id = ?").run(req.user!.userId);
  }
  const result = db.prepare(
    "INSERT INTO contacts (user_id, name, id_card, phone, is_default) VALUES (?, ?, ?, ?, ?)"
  ).run(req.user!.userId, name, id_card, phone || "", is_default ? 1 : 0);
  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(contact);
});

router.post("/batch", authMiddleware, (req: Request, res: Response) => {
  const { contacts } = req.body as { contacts: { name: string; id_card: string; phone: string }[] };
  if (!Array.isArray(contacts) || contacts.length === 0) {
    res.status(400).json({ error: "请提供联系人列表" });
    return;
  }
  if (contacts.length > 50) {
    res.status(400).json({ error: "单次最多导入50个联系人" });
    return;
  }

  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO contacts (user_id, name, id_card, phone, is_default) VALUES (?, ?, ?, ?, 0)"
  );
  const errors: { row: number; error: string }[] = [];
  let imported = 0;

  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (!c.name || !c.id_card) {
      errors.push({ row: i + 1, error: "姓名和身份证号不能为空" });
      continue;
    }
    const idCardError = validateIdCard(c.id_card);
    if (idCardError) {
      errors.push({ row: i + 1, error: idCardError });
      continue;
    }
    const phoneError = validatePhone(c.phone);
    if (phoneError) {
      errors.push({ row: i + 1, error: phoneError });
      continue;
    }
    try {
      insert.run(req.user!.userId, c.name, c.id_card, c.phone || "");
      imported++;
    } catch {
      errors.push({ row: i + 1, error: "该身份证号已存在" });
    }
  }

  res.status(201).json({ imported, errors, total: contacts.length });
});

router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const { name, id_card, phone, is_default } = req.body;
  const db = getDb();
  const contact = db.prepare("SELECT * FROM contacts WHERE id = ? AND user_id = ?").get(req.params.id, req.user!.userId);
  if (!contact) {
    res.status(404).json({ error: "联系人不存在" });
    return;
  }
  if (is_default) {
    db.prepare("UPDATE contacts SET is_default = 0 WHERE user_id = ?").run(req.user!.userId);
  }
  db.prepare("UPDATE contacts SET name = ?, id_card = ?, phone = ?, is_default = ? WHERE id = ?")
    .run(name || (contact as Record<string, unknown>).name, id_card || (contact as Record<string, unknown>).id_card, phone || (contact as Record<string, unknown>).phone, is_default ? 1 : 0, req.params.id);
  const updated = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id);
  res.json(updated);
});

router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM contacts WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: "联系人不存在" });
    return;
  }
  res.json({ message: "删除成功" });
});

export default router;
