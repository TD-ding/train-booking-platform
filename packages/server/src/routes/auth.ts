import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../db/index.js";
import { generateToken, authMiddleware } from "../middleware/auth.js";
import { validatePhone } from "../lib/validate.js";

const router = Router();

router.post("/register", (req: Request, res: Response) => {
  const { username, password, real_name, phone, email } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "用户名和密码不能为空" });
    return;
  }
  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ error: "用户名长度应在2-20个字符之间" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "密码长度不能少于6位" });
    return;
  }
  const phoneError = validatePhone(phone);
  if (phoneError) {
    res.status(400).json({ error: phoneError });
    return;
  }
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    res.status(409).json({ error: "用户名已存在" });
    return;
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (username, password, real_name, phone, email) VALUES (?, ?, ?, ?, ?)"
  ).run(username, hashedPassword, real_name || "", phone || "", email || "");

  const user = db.prepare("SELECT id, username, real_name, phone, email, role FROM users WHERE id = ?")
    .get(result.lastInsertRowid);
  const token = generateToken(Number(result.lastInsertRowid), "user");

  res.status(201).json({ token, user });
});

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "用户名和密码不能为空" });
    return;
  }
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as Record<string, unknown> | undefined;
  if (!user || !bcrypt.compareSync(password, user.password as string)) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  const token = generateToken(user.id as number, user.role as string);
  const { password: _pw, ...userWithoutPassword } = user;
  void _pw;
  res.json({ token, user: userWithoutPassword });
});

router.get("/me", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    "SELECT id, username, real_name, phone, email, role, created_at FROM users WHERE id = ?"
  ).get(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: "用户不存在" });
    return;
  }
  res.json(user);
});

export default router;
