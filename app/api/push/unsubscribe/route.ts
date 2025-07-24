import { NextRequest, NextResponse } from 'next/server';
import { deleteSubscription } from '@/lib/pushNotifications';
import { getUserSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const success = await deleteSubscription(session.user.id, endpoint);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in push unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}