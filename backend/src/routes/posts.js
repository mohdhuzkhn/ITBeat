require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require('express');
const router = express.Router();
const { attachUser, requireAuth } = require('../middleware/auth');
const { z } = require('zod');
// const { Pool } = require('pg');
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const pool = require('../db/pool');

const createPostSchema = z.object({
  title:       z.string().min(5).max(200),
  body:        z.string().min(10).max(5000),
  category_id: z.string().uuid(),
});

router.get('/', attachUser, async (req, res, next) => {
  try {
    const { category, q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.id, p.title, p.body, p.created_at, p.published_at,
             u.username, u.role AS author_role,
             c.name AS category, c.slug AS category_slug
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'approved'
    `;
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND c.slug = $${params.length}`;
    }
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.body ILIKE $${params.length})`;
    }
    query += ` ORDER BY p.published_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const { rows } = await pool.query(query, params);
    res.json({ posts: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.username, u.role AS author_role,
             c.name AS category, c.slug AS category_slug
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1 AND p.status = 'approved'
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', attachUser, requireAuth, async (req, res, next) => {
  try {
    const data = createPostSchema.parse(req.body);
    const isTrusted = ['trusted', 'moderator', 'admin'].includes(req.user.role);
    const status = isTrusted ? 'approved' : 'pending';
    const publishedAt = isTrusted ? new Date() : null;
    const { rows } = await pool.query(`
      INSERT INTO posts (user_id, category_id, title, body, status, published_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, status, created_at
    `, [req.user.id, data.category_id, data.title, data.body, status, publishedAt]);
    const message = isTrusted
      ? 'Post published successfully.'
      : 'Post submitted and is awaiting moderation.';
    res.status(201).json({ post: rows[0], message });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

module.exports = router;