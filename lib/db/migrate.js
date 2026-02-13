/**
 * Database migration script
 * Run: node lib/db/migrate.js
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    // Читаем SQL миграцию
    const migrationPath = path.join(__dirname, 'migrate-add-arrival-token.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');

    // Выполняем миграцию
    await sql.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Added column: arrival_token to inbox_articles');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
