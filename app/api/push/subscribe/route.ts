import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription } from '@/lib/pushNotifications';
import { getUserSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    const success = await saveSubscription(session.user.id, subscription);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in push subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}