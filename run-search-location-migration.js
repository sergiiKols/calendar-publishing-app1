#!/usr/bin/env node

/**
 * Миграция: Добавление search_location_code в таблицу projects
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Читаем .env вручную
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Файл .env не найден');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

const env = loadEnv();

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Начало миграции: добавление search_location_code в projects...\n');

    // Читаем SQL из файла
    const sqlPath = path.join(__dirname, 'lib/db/migrate-add-search-location.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Выполнение миграции...');
    await client.query(sql);

    console.log('\n✅ Миграция успешно выполнена!');
    console.log('\n📊 Проверка результата...');

    // Проверяем что поле добавилось
    const checkResult = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'search_location_code'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Поле search_location_code успешно добавлено:');
      console.log('   Тип:', checkResult.rows[0].data_type);
      console.log('   По умолчанию:', checkResult.rows[0].column_default);
    } else {
      console.error('❌ Ошибка: поле search_location_code не найдено');
    }

    // Проверяем существующие проекты
    const projectsResult = await client.query(`
      SELECT id, name, search_location_code 
      FROM projects 
      LIMIT 5
    `);

    if (projectsResult.rows.length > 0) {
      console.log('\n📋 Существующие проекты:');
      projectsResult.rows.forEach(p => {
        console.log(`   • ${p.name} (ID: ${p.id}) - регион: ${p.search_location_code}`);
      });
    } else {
      console.log('\n📋 Проектов пока нет');
    }

  } catch (error) {
    console.error('\n❌ Ошибка при выполнении миграции:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});
