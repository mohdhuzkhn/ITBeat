require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require('express');
const router = express.Router();
const { attachUser, requireAuth } = require('../middleware/auth');
const { z } = require('zod');
// const { Pool } = require('pg');
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const pool = require('../db/pool');

const commentSchema = z.object({
  body: z.string().min(1).max(1000),
});

router.get('/:postId/comments', attachUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.body, c.created_at,
             u.username, u.role AS author_role
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.postId]);
    res.json({ comments: rows });
  } catch (err) { next(err); }
});

router.post('/:postId/comments', attachUser, requireAuth, async (req, res, next) => {
  try {
    const { body } = commentSchema.parse(req.body);
    const { postId } = req.params;
    const userId = req.user.id;

    const { rows } = await pool.query(`
      INSERT INTO comments (post_id, user_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, body, created_at
    `, [postId, userId, body]);

    await pool.query(`
      INSERT INTO notifications (user_id, type, post_id, actor_id)
      SELECT p.user_id, 'comment', p.id, $1
      FROM posts p WHERE p.id = $2 AND p.user_id != $1
    `, [userId, postId]);

    res.status(201).json({
      comment: {
        ...rows[0],
        username: req.user.username,
        author_role: req.user.role,
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.delete('/:postId/comments/:commentId', attachUser, requireAuth, async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const isAdmin = ['moderator', 'admin'].includes(req.user.role);

    const { rows } = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1', [commentId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Comment not found.' });
    if (rows[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Not allowed.' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ message: 'Comment deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;