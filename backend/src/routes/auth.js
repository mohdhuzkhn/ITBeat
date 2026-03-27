require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const axios = require('axios');
const pool = require('../db/pool');

const registerSchema = z.object({
  email:    z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── EXISTING ROUTES (unchanged) ──────────────────────────

router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password } = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(`
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, role
    `, [email.toLowerCase(), username, hash]);
    res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email or username already taken.' });
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const { password_hash, ...safe } = user;
    res.json({ token: signToken(safe), user: safe });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── GITHUB OAUTH ─────────────────────────────────────────

// Step 1: Redirect user to GitHub
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'user:email',
    allow_signup: 'true',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub redirects back here with ?code=...
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_failed`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_failed`);
    }

    // Fetch GitHub user profile
    const [profileRes, emailsRes] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const githubUser = profileRes.data;

    // Get primary verified email
    const primaryEmail = emailsRes.data.find(e => e.primary && e.verified)?.email
      || emailsRes.data[0]?.email;

    if (!primaryEmail) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
    }

    // Check if user already exists by github_id or email
    const { rows: existing } = await pool.query(
      'SELECT * FROM users WHERE github_id = $1 OR email = $2',
      [String(githubUser.id), primaryEmail.toLowerCase()]
    );

    let user;

    if (existing[0]) {
      // User exists — update github_id if not set yet (existing email user logging in with GitHub)
      user = existing[0];
      if (!user.github_id) {
        await pool.query(
          'UPDATE users SET github_id = $1 WHERE id = $2',
          [String(githubUser.id), user.id]
        );
        user.github_id = String(githubUser.id);
      }
    } else {
      // New user — auto-create account
      // Build a unique username from GitHub login
      let baseUsername = githubUser.login.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 28);
      let username = baseUsername;
      let suffix = 1;

      // Keep trying until username is unique
      while (true) {
        const { rows: taken } = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [username]
        );
        if (!taken[0]) break;
        username = `${baseUsername}_${suffix++}`;
      }

      const { rows: created } = await pool.query(`
        INSERT INTO users (email, username, password_hash, github_id, role)
        VALUES ($1, $2, $3, $4, 'user')
        RETURNING id, email, username, role, github_id
      `, [primaryEmail.toLowerCase(), username, null, String(githubUser.id)]);

      user = created[0];
    }

    const { password_hash, ...safe } = user;
    const token = signToken(safe);

    // Redirect to frontend with token in URL — frontend will extract and store it
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safe))}`);

  } catch (err) {
    console.error('GitHub OAuth error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=github_failed`);
  }
});

module.exports = router;