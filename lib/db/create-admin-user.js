/**
 * Script to create admin user
 * Run: node lib/db/create-admin-user.js
 */

const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');

    const email = 'admin@calendar.app';
    const password = 'password123';
    const name = 'Admin';

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Проверяем, существует ли уже пользователь
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists!');
      console.log('📧 Email:', email);
      return;
    }

    // Создаём пользователя
    await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
    `;

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('You can now login at: https://calendar-app-gamma-puce.vercel.app/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
