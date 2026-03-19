require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    await client.query(`
      INSERT INTO categories (name, slug) VALUES
        ('AI & Machine Learning', 'ai-ml'),
        ('Web & App Development', 'web-dev'),
        ('Cloud & DevOps',        'cloud-devops'),
        ('Hardware & Devices',    'hardware')
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('Categories seeded.');

    const hash = await bcrypt.hash('ChangeMe123!', 12);
    await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('admin@itbeat.local', 'admin', $1, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);
    console.log('Admin user seeded.');
    console.log('');
    console.log('✅ Seed complete!');
    console.log('Login: admin@itbeat.local / ChangeMe123!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();