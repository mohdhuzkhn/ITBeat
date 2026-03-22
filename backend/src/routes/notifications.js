require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require('express');
const router = express.Router();
const { attachUser, requireAuth } = require('../middleware/auth');
// const { Pool } = require('pg');
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const pool = require('../db/pool');

router.get('/', attachUser, requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT n.id, n.type, n.is_read, n.created_at,
             p.title AS post_title, p.id AS post_id,
             u.username AS actor_username
      FROM notifications n
      JOIN posts p ON p.id = n.post_id
      JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 30
    `, [req.user.id]);
    res.json({ notifications: rows });
  } catch (err) { next(err); }
});

router.patch('/read-all', attachUser, requireAuth, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
});

router.get('/unread-count', attachUser, requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { next(err); }
});

module.exports = router;