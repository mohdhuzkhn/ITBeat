require("dotenv").config({
  path: require("path").join(__dirname, "../../..", ".env"),
});
const express = require("express");
const router = express.Router();
const { attachUser, requireAuth } = require("../middleware/auth");
const pool = require("../db/pool");

// GET /api/v1/users/:username — public profile
router.get("/:username", attachUser, async (req, res, next) => {
  try {
    // Get user info
    const { rows: userRows } = await pool.query(
      `SELECT id, username, role, created_at FROM users WHERE username = $1`,
      [req.params.username]
    );
    if (!userRows[0]) return res.status(404).json({ error: "User not found." });
    const user = userRows[0];

    // Get their approved posts
    const { rows: posts } = await pool.query(
      `SELECT p.id, p.title, p.body, p.created_at, p.published_at,
              c.name AS category, c.slug AS category_slug
       FROM posts p
       JOIN categories c ON c.id = p.category_id
       WHERE p.user_id = $1 AND p.status = 'approved'
       ORDER BY p.published_at DESC`,
      [user.id]
    );

    // Get posts they liked
    const { rows: likedPosts } = await pool.query(
      `SELECT p.id, p.title, p.published_at,
              u.username AS author,
              c.name AS category, c.slug AS category_slug
       FROM post_likes pl
       JOIN posts p ON p.id = pl.post_id
       JOIN users u ON u.id = p.user_id
       JOIN categories c ON c.id = p.category_id
       WHERE pl.user_id = $1 AND p.status = 'approved'
       ORDER BY pl.created_at DESC`,
      [user.id]
    );

    // Get their comments
    const { rows: comments } = await pool.query(
      `SELECT cm.id, cm.body, cm.created_at,
              p.id AS post_id, p.title AS post_title
       FROM comments cm
       JOIN posts p ON p.id = cm.post_id
       WHERE cm.user_id = $1 AND p.status = 'approved'
       ORDER BY cm.created_at DESC`,
      [user.id]
    );

    res.json({ user, posts, likedPosts, comments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;