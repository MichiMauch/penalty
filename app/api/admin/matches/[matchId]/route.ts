import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, initDB } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);
    
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    await initDB();
    
    const { matchId } = await params;
    // Delete the match
    const result = await db.execute({
      sql: 'DELETE FROM matches WHERE id = ?',
      args: [matchId]
    });
    
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Match ${matchId} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    
    // Handle auth errors
    if (error instanceof Error) {
      if (error.message.includes('Admin-Berechtigung') || error.message.includes('Authentifizierung')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}