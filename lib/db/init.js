/**
 * Database initialization script
 * Run: node lib/db/init.js
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Читаем SQL схему
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Разбиваем на отдельные команды
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    // Выполняем каждую команду
    for (const command of commands) {
      await sql.query(command);
    }

    console.log('✅ Database initialized successfully!');
    console.log('📊 Created tables:');
    console.log('   - users');
    console.log('   - inbox_articles');
    console.log('   - calendar_events');
    console.log('   - publishing_platforms');
    console.log('   - publish_logs');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
