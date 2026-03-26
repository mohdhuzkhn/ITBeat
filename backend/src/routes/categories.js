require("dotenv").config({
  path: require("path").join(__dirname, "../../..", ".env"),
});
const express = require("express");
const router = express.Router();
// const { Pool } = require("pg");
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const pool = require("../db/pool");

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

const updatePostSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(10).max(5000),
  category_id: z.string().uuid(),
});

router.patch("/:id", attachUser, requireAuth, async (req, res, next) => {
  try {
    // Only admin can edit
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const data = updatePostSchema.parse(req.body);

    const { rows } = await pool.query(
      `
      UPDATE posts
      SET title = $1, body = $2, category_id = $3
      WHERE id = $4
      RETURNING id, title, body, category_id
    `,
      [data.title, data.body, data.category_id, req.params.id],
    );

    if (!rows[0]) return res.status(404).json({ error: "Post not found." });

    res.json({ post: rows[0], message: "Post updated successfully." });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ error: err.errors });
    next(err);
  }
});

module.exports = router;

// That completes the entire **backend**! 🎉

// Here's what we've built so far:
// ```
// backend/
// ├── package.json          ✅
// └── src/
//     ├── index.js          ✅
//     ├── routes/
//     │   ├── auth.js       ✅
//     │   ├── posts.js      ✅
//     │   ├── admin.js      ✅
//     │   └── categories.js ✅
//     ├── middleware/
//     │   ├── auth.js       ✅
//     │   └── errorHandler.js ✅
//     └── db/
//         ├── migrate.js    ✅
//         ├── seed.js       ✅
//         └── migrations/
//             └── 001_initial.js ✅
