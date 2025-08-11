import { db } from './db';
import { EmailPreferences } from './types';

/**
 * Check if a user wants to receive a specific type of email
 */
export async function shouldSendEmail(userId: string, emailType: keyof EmailPreferences): Promise<boolean> {
  if (!db) {
    console.warn('Database not configured - defaulting to send email');
    return true;
  }

  try {
    const result = await db.execute({
      sql: 'SELECT email_preferences FROM users WHERE id = ?',
      args: [userId]
    });

    if (result.rows.length === 0) {
      console.warn(`User ${userId} not found - defaulting to send email`);
      return true;
    }

    const user = result.rows[0];
    if (!user.email_preferences) {
      // No preferences set, default to sending all emails
      return true;
    }

    try {
      const preferences = JSON.parse(user.email_preferences as string) as EmailPreferences;
      return preferences[emailType] ?? true; // Default to true if preference not set
    } catch (error) {
      console.error('Error parsing email preferences:', error);
      return true; // Default to sending email if parsing fails
    }
  } catch (error) {
    console.error('Error checking email preferences:', error);
    return true; // Default to sending email if query fails
  }
}

/**
 * Get user ID by email address for email preference checking
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!db) {
    return null;
  }

  try {
    const result = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].id as string;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
}

/**
 * Wrapper function to check email preferences before sending
 */
export async function checkEmailPreference(
  recipientEmail: string,
  emailType: keyof EmailPreferences
): Promise<boolean> {
  const userId = await getUserIdByEmail(recipientEmail);
  if (!userId) {
    // If we can't find the user, default to sending email
    console.warn(`User not found for email ${recipientEmail} - defaulting to send`);
    return true;
  }

  return await shouldSendEmail(userId, emailType);
}