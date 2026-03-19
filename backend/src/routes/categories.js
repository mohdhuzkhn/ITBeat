require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json({ categories: rows });
  } catch (err) {
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
