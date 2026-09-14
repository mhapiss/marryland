// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES = '7d';

// Helper to generate JWT
function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Register (email/password)
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, studio_name, studio_slug, whatsapp_number } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const client = await pool.connect();
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      client.release();
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const insertQuery = `INSERT INTO users (name, email, password_hash, studio_name, studio_slug, whatsapp_number)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, studio_slug`;
    const result = await client.query(insertQuery, [name, email, password_hash, studio_name, studio_slug, whatsapp_number]);
    const user = result.rows[0];
    const token = generateToken(user.id);
    client.release();
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login (email/password)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT id, password_hash, name, email, studio_slug FROM users WHERE email = $1', [email]);
    client.release();
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, studio_slug: user.studio_slug } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
