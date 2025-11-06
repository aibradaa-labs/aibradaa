/**
 * Email Adapter
 * Handles email sending for magic links and notifications
 */

import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send magic link email
export async function sendMagicLink(email, token) {
  const magicLinkUrl = `${process.env.APP_URL}/auth/verify/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@aibradaa.com',
    to: email,
    subject: 'Your AI Bradaa Magic Link',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to AI Bradaa!</h2>
        <p>Click the button below to sign in to your account:</p>
        <a href="${magicLinkUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Sign In
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px;">${magicLinkUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Magic link sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send magic link email');
  }
}

// Send welcome email
export async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@aibradaa.com',
    to: email,
    subject: 'Welcome to AI Bradaa!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Selamat datang, ${name}!</h2>
        <p>Welcome to AI Bradaa - your Malaysia-first AI-powered laptop recommendation service.</p>
        <p>We're excited to help you find the perfect laptop for your needs.</p>
        <p>Get started by:</p>
        <ul>
          <li>Telling us your budget and requirements</li>
          <li>Getting personalized recommendations</li>
          <li>Comparing options side-by-side</li>
        </ul>
        <p>Happy laptop hunting!</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          - The AI Bradaa Team
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw - welcome email is not critical
  }
}
