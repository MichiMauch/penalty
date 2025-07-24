import webpush from 'web-push';
import { db } from './db';

// Configure web-push
if (process.env.VAPID_EMAIL && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// Save subscription to database
export async function saveSubscription(userId: string, subscription: PushSubscription): Promise<boolean> {
  if (!db) return false;

  try {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.execute({
      sql: `
        INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth
      `,
      args: [
        subscriptionId,
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]
    });

    console.log('Push subscription saved for user:', userId);
    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
}

// Delete subscription from database
export async function deleteSubscription(userId: string, endpoint: string): Promise<boolean> {
  if (!db) return false;

  try {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      args: [userId, endpoint]
    });

    console.log('Push subscription deleted for user:', userId);
    return true;
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return false;
  }
}

// Get all subscriptions for a user
export async function getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
  if (!db) return [];

  try {
    const result = await db.execute({
      sql: 'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
      args: [userId]
    });

    return result.rows.map((row: any) => ({
      endpoint: row.endpoint as string,
      keys: {
        p256dh: row.p256dh as string,
        auth: row.auth as string
      }
    }));
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return [];
  }
}

// Send push notification to a user
export async function sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
  if (!process.env.VAPID_EMAIL || !process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.warn('VAPID keys not configured - skipping push notification');
    return false;
  }

  try {
    const subscriptions = await getUserSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return false;
    }

    const notificationPayload = JSON.stringify(payload);
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        console.log('Push notification sent successfully to:', subscription.endpoint);
        return true;
      } catch (error: any) {
        console.error('Error sending push notification:', error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await deleteSubscription(userId, subscription.endpoint);
        }
        
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    return results.some(result => result);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
}

// Send challenge notification
export async function sendChallengeNotification(
  challengedUserId: string, 
  challengerName: string,
  matchId: string
): Promise<boolean> {
  const payload: NotificationPayload = {
    title: '⚽ Neue Herausforderung!',
    body: `${challengerName} fordert dich zum Elfmeterschießen heraus!`,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    url: `/game/${matchId}`,
    tag: `challenge-${matchId}`
  };

  return sendPushNotification(challengedUserId, payload);
}

// Send game finished notification
export async function sendGameFinishedNotification(
  userId: string,
  opponentName: string,
  won: boolean,
  matchId: string
): Promise<boolean> {
  const payload: NotificationPayload = {
    title: won ? '🎉 Sieg!' : '😔 Niederlage',
    body: `Dein Spiel gegen ${opponentName} ist beendet. ${won ? 'Du hast gewonnen!' : 'Besser kämpfen beim nächsten Mal!'}`,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    url: `/game/${matchId}`,
    tag: `result-${matchId}`
  };

  return sendPushNotification(userId, payload);
}