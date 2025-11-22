import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate } from './emailTemplate';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendChannelInviteEmail(to: string, channelName: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `You have been added to channel: ${channelName}`,
    text: `You have been added as a member to the channel "${channelName}". Log in to participate!`,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(to: string, username: string) {
  const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:8000/api/';

  const {html, subject} = getWelcomeEmailTemplate(username, { 
    websiteUrl,
    companyName: 'Triviaverse',
  });
  
  const mailOptions = {
    from: `"Triviaverse" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: `Welcome to Triviaverse, ${username}! Visit ${websiteUrl} to get started.`,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(to: string, username: string, resetUrl: string) {
  const mailOptions = {
    from: `"Triviaverse" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Reset Your Password - Triviaverse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Reset Your Password</h1>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
          <strong>⚠️ Security Notice:</strong><br>
          This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
        </p>
        <p style="font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          © ${new Date().getFullYear()} Quiz Master. All rights reserved.
        </p>
      </div>
    `,
    text: `Hi ${username}, we received a request to reset your password. Click here to reset: ${resetUrl}. This link expires in 1 hour. If you didn't request this, please ignore this email.`,
  };
  await transporter.sendMail(mailOptions);
}

