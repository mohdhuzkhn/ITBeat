require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { attachUser, requireAuth } = require('../middleware/auth');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.post('/:postId/like', attachUser, requireAuth, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existing.rows[0]) {
      await pool.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      const { rows } = await pool.query(
        'SELECT COUNT(*) FROM post_likes WHERE post_id = $1', [postId]
      );
      return res.json({ liked: false, likes: parseInt(rows[0].count) });
    }

    await pool.query(
      'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)',
      [postId, userId]
    );

    await pool.query(`
      INSERT INTO notifications (user_id, type, post_id, actor_id)
      SELECT p.user_id, 'like', p.id, $1
      FROM posts p WHERE p.id = $2 AND p.user_id != $1
    `, [userId, postId]);

    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM post_likes WHERE post_id = $1', [postId]
    );
    res.json({ liked: true, likes: parseInt(rows[0].count) });
  } catch (err) { next(err); }
});

router.get('/:postId/likes', attachUser, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM post_likes WHERE post_id = $1', [postId]
    );

    let liked = false;
    if (userId) {
      const check = await pool.query(
        'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      liked = !!check.rows[0];
    }

    res.json({ likes: parseInt(rows[0].count), liked });
  } catch (err) { next(err); }
});

module.exports = router;