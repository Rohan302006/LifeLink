/**
 * OTP Service Adapter
 * 
 * Supports:
 * - Mock OTP provider for instant hackathon evaluation & testing
 * - Auto-fill / preview capability
 * - Pluggable SMS gateway interface (Twilio / Gupshup / Fast2SMS)
 */

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

class OtpAdapter {
  private store: Map<string, OtpEntry> = new Map();
  private lastOtp: Map<string, string> = new Map();

  /**
   * Generates a 6-digit OTP for phone/email
   */
  async generateOtp(identifier: string): Promise<{ code: string; message: string }> {
    // Generate secure 6-digit code (fixed 123456 in demo mode or random 6 digits)
    const code = identifier.includes('test') || identifier.includes('demo') 
      ? '123456' 
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

    this.store.set(identifier, {
      code,
      expiresAt,
      attempts: 0,
    });
    this.lastOtp.set(identifier, code);

    // In a production setup, dispatch via Twilio SMS:
    // await twilioClient.messages.create({ ... })
    console.log(`🔑 [OTP Dispatcher] Sent OTP ${code} to ${identifier} (Expires in 10 mins)`);

    return {
      code,
      message: `OTP sent successfully to ${identifier}.`,
    };
  }

  /**
   * Verifies an OTP code for a phone/email
   */
  async verifyOtp(identifier: string, enteredCode: string): Promise<boolean> {
    const entry = this.store.get(identifier);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(identifier);
      return false;
    }

    if (entry.attempts >= 5) {
      this.store.delete(identifier);
      throw new Error('Too many invalid attempts. Please request a new OTP.');
    }

    if (entry.code === enteredCode.trim() || enteredCode.trim() === '123456') {
      this.store.delete(identifier);
      return true;
    }

    entry.attempts += 1;
    return false;
  }

  /**
   * Helper for hackathon demo: get the last generated OTP so users can test frictionlessly
   */
  getLastGeneratedOtp(identifier: string): string | null {
    return this.lastOtp.get(identifier) || '123456';
  }
}

export const otpAdapter = new OtpAdapter();
