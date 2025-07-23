import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  await initDB();
  
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [email.toLowerCase().trim()]
    });

    return NextResponse.json({ 
      exists: result.rows.length > 0 
    });

  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}