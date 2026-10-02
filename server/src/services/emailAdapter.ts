/**
 * Email & Notification Service Adapter
 * 
 * Supports:
 * - Mock logger with live notification dispatch
 * - Pluggable SMTP / Resend / Nodemailer interface
 * - In-app notification creation
 */

import { inMemoryDB } from '../db/database.js';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  userId?: string;
  type?: string;
}

class EmailAdapter {
  private sentHistory: Array<EmailPayload & { timestamp: string }> = [];

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; id: string }> {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    this.sentHistory.unshift({
      ...payload,
      timestamp,
    });

    // If userId provided, store in in-app notifications
    if (payload.userId) {
      inMemoryDB.notifications.set(id, {
        id,
        user_id: payload.userId,
        title: payload.subject,
        message: payload.body,
        type: payload.type || 'info',
        is_read: false,
        created_at: timestamp,
      });
    }

    console.log(`✉️ [Email Service] To: ${payload.to} | Subject: ${payload.subject}`);
    return { success: true, id };
  }

  getRecentSentEmails(limit: number = 10) {
    return this.sentHistory.slice(0, limit);
  }
}

export const emailAdapter = new EmailAdapter();
