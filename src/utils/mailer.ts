import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate, getPasswordResetEmailTemplate, getChannelInviteEmailTemplate } from './emailTemplate';
import { getSupportEmailTemplate } from './emailTemplate';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendChannelInviteEmail(to: string, channelName: string, inviterName?: string) {
  const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:8000/api/';
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

  const { html, subject } = getChannelInviteEmailTemplate(channelName, inviterName, {
    websiteUrl,
    companyName: 'Triviaverse',
    supportEmail,
  });

  const mailOptions = {
    from: `"Triviaverse" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: `You have been invited to join the channel "${channelName}". ${inviterName ? `Invited by ${inviterName}. ` : ''}Log in at ${websiteUrl} to participate!`,
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
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

  const { html, subject } = getPasswordResetEmailTemplate(resetUrl, username, {
    companyName: 'Triviaverse',
    supportEmail,
  });

  const mailOptions = {
    from: `"Triviaverse" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: `Hi ${username}, we received a request to reset your password. Click here to reset: ${resetUrl}. This link expires in 1 hour. If you didn't request this, please ignore this email.`,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendSupportEmail(fromName: string, fromEmail: string, subjectLine: string, messageBody: string) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

  const { html } = getSupportEmailTemplate(fromName, fromEmail, subjectLine, messageBody, {
    websiteUrl: process.env.WEBSITE_URL,
    companyName: 'Triviaverse',
    supportEmail,
  });

  const mailOptions = {
    from: `"Triviaverse Support" <${process.env.EMAIL_USER}>`,
    to: supportEmail,
    subject: `[Support] Action: Alert for sending message- ${subjectLine}`,
    html,
    text: `From: ${fromName} <${fromEmail}>\nSubject: ${subjectLine}\n\n${messageBody}`,
  };

  await transporter.sendMail(mailOptions);
}

