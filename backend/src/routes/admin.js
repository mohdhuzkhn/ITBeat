require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require('express');
const router = express.Router();
const { attachUser, requireAuth, requireRole } = require('../middleware/auth');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.use(attachUser, requireAuth, requireRole('moderator', 'admin'));

router.get('/queue', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.title, p.body, p.created_at,
             u.username, u.email, u.approved_posts_count,
             c.name AS category
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `);
    res.json({ queue: rows });
  } catch (err) { next(err); }
});

router.patch('/posts/:id/approve', async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`
        UPDATE posts SET status = 'approved', published_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING user_id
      `, [req.params.id]);
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Post not found or already reviewed.' });
      }
      await client.query(`
        UPDATE users SET approved_posts_count = approved_posts_count + 1
        WHERE id = $1
      `, [rows[0].user_id]);
      await client.query('COMMIT');
      res.json({ message: 'Post approved and published.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

router.patch('/posts/:id/reject', async (req, res, next) => {
  try {
    await pool.query(`
      UPDATE posts SET status = 'rejected'
      WHERE id = $1 AND status = 'pending'
    `, [req.params.id]);
    res.json({ message: 'Post rejected.' });
  } catch (err) { next(err); }
});

router.patch('/users/:id/trust', requireRole('admin'), async (req, res, next) => {
  try {
    await pool.query(`UPDATE users SET role = 'trusted' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'User promoted to trusted.' });
  } catch (err) { next(err); }
});


router.delete('/posts/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) { next(err); }
});


module.exports = router;