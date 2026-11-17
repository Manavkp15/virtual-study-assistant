import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const getTransporter = (): Transporter | null => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: { user, pass },
    });
  }
  return null;
};

/**
 * Generate a cryptographically secure random token, its SHA-256 hash, and expiration timestamp.
 */
export const generateSecureToken = (expiryHours: number = 24) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
};

/**
 * Create a SHA-256 hash of a raw token for safe database storage and lookup.
 */
export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Send an email verification message to a newly registered user.
 */
export const sendVerificationEmail = async (
  toEmail: string,
  rawToken: string,
  recipientName: string = 'Student'
): Promise<{ success: boolean; simulated: boolean; verificationUrl: string }> => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(toEmail)}`;
  const emailFrom = process.env.EMAIL_FROM || '"VM જ્ઞાનસેતુ" <noreply@vm-gyansetu.edu>';

  const subject = 'ઈમેઇલ ચકાસણી / Verify your Email - VM જ્ઞાનસેતુ';
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">VM જ્ઞાનસેતુ</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">વર્ચ્યુઅલ સ્ટડી આસિસ્ટન્ટ પ્લેટફોર્મ</p>
      </div>
      <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
        <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">નમસ્તે ${recipientName},</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          VM જ્ઞાનસેતુમાં નોંધણી કરવા બદલ આભાર! તમારા એકાઉન્ટને સક્રિય કરવા અને સુરક્ષિત રાખવા માટે, કૃપા કરીને નીચે આપેલા બટન પર ક્લિક કરીને તમારું ઈમેઇલ સરનામું ચકાસો:
        </p>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
          Thank you for registering on VM GyanSetu! Please verify your email address to activate your account:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            ઈમેઇલ ચકાસો / Verify Email Address
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
          જો બટન કામ ન કરતું હોય, તો નીચેની લિંકને તમારા બ્રાઉઝરમાં કોપી કરો:<br/>
          <a href="${verificationUrl}" style="color: #38bdf8; word-break: break-all;">${verificationUrl}</a>
        </p>
        <p style="color: #ef4444; font-size: 11px; margin-top: 16px;">
          આ લિંક 24 કલાક માટે માન્ય છે. (This link expires in 24 hours.)
        </p>
      </div>
    </div>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject,
        html,
      });
      return { success: true, simulated: false, verificationUrl };
    } catch (err) {
      console.error('[EMAIL SERVICE] Failed to send email via SMTP transport:', err);
      // Fall through to console logging so user testing is never blocked
    }
  }

  // Fallback mode for development & test environments without SMTP credentials
  console.log('\n============================================================');
  console.log('📧 [EMAIL SERVICE - VERIFICATION LINK GENERATED]');
  console.log(`Recipient: ${toEmail} (${recipientName})`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log(`Token: ${rawToken}`);
  console.log('Validity: 24 Hours');
  console.log('============================================================\n');

  return { success: true, simulated: true, verificationUrl };
};

/**
 * Send password reset instructions.
 */
export const sendPasswordResetEmail = async (
  toEmail: string,
  rawToken: string,
  recipientName: string = 'User'
): Promise<{ success: boolean; simulated: boolean; resetUrl: string }> => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(toEmail)}`;
  const emailFrom = process.env.EMAIL_FROM || '"VM જ્ઞાનસેતુ" <noreply@vm-gyansetu.edu>';

  const subject = 'પાસવર્ડ રીસેટ સૂચનાઓ / Password Reset - VM જ્ઞાનસેતુ';
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #38bdf8;">VM જ્ઞાનસેતુ પાસવર્ડ રીસેટ</h2>
      <p>નમસ્તે ${recipientName}, પાસવર્ડ બદલવા માટે નીચેની લિંક પર ક્લિક કરો:</p>
      <div style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          પાસવર્ડ રીસેટ કરો / Reset Password
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">Link expires in 1 hour.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject,
        html,
      });
      return { success: true, simulated: false, resetUrl };
    } catch (err) {
      console.error('[EMAIL SERVICE] Failed to send password reset via SMTP:', err);
    }
  }

  console.log('\n============================================================');
  console.log('📧 [EMAIL SERVICE - PASSWORD RESET LINK GENERATED]');
  console.log(`Recipient: ${toEmail}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('============================================================\n');

  return { success: true, simulated: true, resetUrl };
};
