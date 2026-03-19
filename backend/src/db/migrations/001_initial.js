require("dotenv").config({
  path: require("path").join(__dirname, "../../../..", ".env"),
});
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = `
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'new_user'
                CHECK (role IN ('new_user', 'trusted', 'moderator', 'admin')),
  approved_posts_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_status    ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category  ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_user      ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at DESC NULLS LAST);

CREATE OR REPLACE FUNCTION promote_trusted_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approved_posts_count >= 5 AND NEW.role = 'new_user' THEN
    NEW.role = 'trusted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_promote_trusted ON users;
CREATE TRIGGER trg_promote_trusted
  BEFORE UPDATE OF approved_posts_count ON users
  FOR EACH ROW EXECUTE FUNCTION promote_trusted_user();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");
    await client.query(migrations);
    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    // await pool.end();
  }
}

async function migrate2() {
  const client = await pool.connect();
  try {
    console.log("Running new feature migrations...");
    await client.query(`

      CREATE TABLE IF NOT EXISTS post_likes (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       TEXT NOT NULL CHECK (type IN ('like', 'comment')),
        post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
        actor_id   UUID REFERENCES users(id) ON DELETE CASCADE,
        is_read    BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_likes_post    ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_likes_user    ON post_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_notifs_user   ON notifications(user_id);

    `);
    console.log("New tables created successfully.");
  } catch (err) {
    console.error("Migration 2 failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().then(() => migrate2());
