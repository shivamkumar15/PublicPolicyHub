import { query } from './db.js';

async function migrate() {
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);');
    console.log('Migration complete. Added password_hash.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
