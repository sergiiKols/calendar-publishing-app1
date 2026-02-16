/**
 * API endpoint to create admin user
 * POST /api/setup/create-admin
 * 
 * This is a one-time setup endpoint.
 * In production, this should be removed or protected.
 */

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const email = 'admin@calendar.app';
    const password = 'password123';
    const name = 'Admin';

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Admin user already exists',
          email: email
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name
    `;

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: result.rows[0],
      credentials: {
        email: email,
        password: password
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if admin exists
export async function GET() {
  try {
    const result = await sql`
      SELECT id, email, name, created_at FROM users WHERE email = 'admin@calendar.app'
    `;

    if (result.rows.length > 0) {
      return NextResponse.json({
        exists: true,
        user: result.rows[0]
      });
    }

    return NextResponse.json({
      exists: false,
      message: 'Admin user not found. Use POST to create.'
    });

  } catch (error) {
    console.error('Error checking admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
