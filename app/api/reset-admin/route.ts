/**
 * Reset admin password endpoint
 * POST /api/reset-admin
 * 
 * This endpoint deletes and recreates the admin user.
 * For security, it should be removed after initial setup.
 */

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/sql';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔄 Resetting admin user...');

    const adminEmail = 'admin@calendar.app';
    const adminPassword = 'password123';
    const adminName = 'Admin';

    // Delete existing admin if exists
    await sql`
      DELETE FROM users WHERE email = ${adminEmail}
    `;
    console.log('🗑️  Deleted old admin user');

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    console.log('🔐 Password hashed');

    // Create new admin user
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${adminEmail}, ${passwordHash}, ${adminName})
      RETURNING id, email, name, created_at
    `;

    console.log('✅ Admin user recreated successfully!');

    return NextResponse.json({
      success: true,
      message: '✅ Admin user reset successfully!',
      user: result.rows[0],
      credentials: {
        email: adminEmail,
        password: adminPassword
      },
      test_login: {
        url: 'https://calendar-app-gamma-puce.vercel.app/login',
        email: adminEmail,
        password: adminPassword
      }
    });

  } catch (error: any) {
    console.error('❌ Error resetting admin:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to reset admin user',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to reset admin user',
    usage: 'POST /api/reset-admin'
  });
}
