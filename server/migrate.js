const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log('Migration ' + file + ' applied');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('Migration ' + file + ' (tables exist, skipping)');
      } else {
        console.error('Migration ' + file + ' failed:', err.message);
        throw err;
      }
    }
  }
}

module.exports = migrate;
