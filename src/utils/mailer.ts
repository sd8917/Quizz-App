import nodemailer from 'nodemailer';
import { getChannelInviteEmailTemplate, getWelcomeEmailTemplate, getPasswordResetEmailTemplate } from './emailTemplates';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send channel invitation email with beautiful HTML template
 */
export async function sendChannelInviteEmail(
  to: string, 
  channelName: string, 
  inviterName?: string
) {
  const { html, subject } = getChannelInviteEmailTemplate(channelName, inviterName, {
    websiteUrl: process.env.WEBSITE_URL || 'http://localhost:3000',
    supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
    companyName: 'Quiz Master'
  });

  const mailOptions = {
    from: `"Quiz Master" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    // Fallback plain text version
    text: `You have been invited to join the channel "${channelName}"${inviterName ? ` by ${inviterName}` : ''}. Visit ${process.env.WEBSITE_URL || 'http://localhost:3000'} to get started!`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(to: string, username: string) {
  const { html, subject } = getWelcomeEmailTemplate(username, {
    websiteUrl: process.env.WEBSITE_URL || 'http://localhost:3000',
    companyName: 'Quiz Master'
  });

  const mailOptions = {
    from: `"Quiz Master" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: `Welcome to Quiz Master, ${username}! Start your journey to excellence today.`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string, 
  username: string, 
  resetUrl: string
) {
  const { html, subject } = getPasswordResetEmailTemplate(resetUrl, username, {
    companyName: 'Quiz Master',
    supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER
  });

  const mailOptions = {
    from: `"Quiz Master" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: `Hi ${username}, we received a request to reset your password. Click here to reset: ${resetUrl}. This link expires in 1 hour.`,
  };

  await transporter.sendMail(mailOptions);
}

