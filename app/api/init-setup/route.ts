/**
 * Initial setup endpoint - creates admin user if none exists
 * GET /api/init-setup
 * 
 * This endpoint is public but can only create admin once.
 * After admin exists, it will return 403.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Checking if admin user exists...');

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id, email, created_at FROM users WHERE email = $1',
      ['admin@calendar.app']
    );

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Admin user already exists. Setup is complete.',
          admin: {
            email: existingAdmin[0].email,
            created_at: existingAdmin[0].created_at
          }
        },
        { status: 403 }
      );
    }

    console.log('👤 Creating admin user...');

    const adminEmail = 'admin@calendar.app';
    const adminPassword = 'password123';
    const adminName = 'Admin';

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [adminEmail, passwordHash, adminName]
    );

    console.log('✅ Admin user created successfully!');

    return NextResponse.json({
      success: true,
      message: '🎉 Admin user created successfully!',
      user: result[0],
      credentials: {
        email: adminEmail,
        password: adminPassword,
        login_url: 'https://calendar-app-gamma-puce.vercel.app/login'
      },
      next_steps: [
        'Go to https://calendar-app-gamma-puce.vercel.app/login',
        `Login with email: ${adminEmail}`,
        `Password: ${adminPassword}`,
        'Start using the calendar app!'
      ]
    });

  } catch (error: any) {
    console.error('❌ Error during setup:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create admin user',
        details: error.message,
        hint: 'Make sure the database is initialized. Run schema.sql first.'
      },
      { status: 500 }
    );
  }
}
