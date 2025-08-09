import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { db, initDB } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { language } = await request.json();
    
    if (!['de', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }
    
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    await initDB();
    
    // Update user's preferred language
    await db.execute({
      sql: 'UPDATE users SET preferred_language = ? WHERE id = ?',
      args: [language, session.user.id]
    });
    
    return NextResponse.json({ 
      success: true, 
      language,
      message: `Language preference updated to ${language}` 
    });
  } catch (error) {
    console.error('Error updating language preference:', error);
    return NextResponse.json(
      { error: 'Failed to update language preference' },
      { status: 500 }
    );
  }
}