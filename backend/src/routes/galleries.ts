// src/routes/galleries.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to verify JWT and attach userId to request
function authenticate(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Create new gallery (photographer)
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { client_name, client_slug, gdrive_folder_url, gdrive_folder_id, max_photos_selectable, deadline_date, client_whatsapp, allow_download, highlight_description } = req.body;
  const userId = (req as any).userId;
  if (!client_name || !client_slug || !gdrive_folder_url || !gdrive_folder_id || !max_photos_selectable || !deadline_date || !client_whatsapp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const client = await pool.connect();
    const insert = `INSERT INTO galleries (user_id, client_name, client_slug, gdrive_folder_url, gdrive_folder_id, max_photos_selectable, deadline_date, client_whatsapp, allow_download, highlight_description)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
    const values = [userId, client_name, client_slug, gdrive_folder_url, gdrive_folder_id, max_photos_selectable, deadline_date, client_whatsapp, allow_download || false, highlight_description || null];
    const result = await client.query(insert, values);
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all galleries for logged‑in photographer
router.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM galleries WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single gallery by slug (public endpoint for client selection)
router.get('/:studio_slug/:client_slug', async (req: Request, res: Response) => {
  const { client_slug } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM galleries WHERE client_slug = $1', [client_slug]);
    client.release();
    if (result.rowCount === 0) return res.status(404).json({ error: 'Gallery not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
