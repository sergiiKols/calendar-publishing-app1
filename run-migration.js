/**
 * Скрипт для выполнения миграции project_categories
 * Запуск: node run-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Подключение к базе данных...');
    
    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, 'lib/db/migrate-add-project-categories.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Выполнение миграции...');
    console.log('Файл:', migrationPath);
    
    // Выполняем миграцию
    await pool.query(migrationSQL);
    
    console.log('✅ Миграция выполнена успешно!');
    console.log('');
    console.log('Созданы:');
    console.log('  ✓ Таблица project_categories');
    console.log('  ✓ Поле category_id в seo_keywords');
    console.log('  ✓ Поле category_id в seo_semantic_clusters');
    console.log('  ✓ Индексы и триггеры');
    console.log('');
    console.log('🎉 Направления проектов готовы к использованию!');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
