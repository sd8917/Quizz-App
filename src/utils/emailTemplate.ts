/**
 * Email HTML Templates
 * Professional, responsive email templates for various notifications
 */

interface EmailTemplateOptions {
  websiteUrl?: string;
  supportEmail?: string;
  companyName?: string;
}

const defaultOptions: EmailTemplateOptions = {
  websiteUrl: process.env.WEBSITE_URL || 'http://localhost:8000/api',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
  companyName: 'Triviaverse'
};

/**
 * Channel Invitation Email Template
 * Beautiful landing page style with CTA button
 */
export function getChannelInviteEmailTemplate(
  channelName: string,
  inviterName?: string,
  options: EmailTemplateOptions = {}
): { html: string; subject: string } {
  const { websiteUrl, supportEmail, companyName } = { ...defaultOptions, ...options };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to ${channelName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.2;
    }
    .header .highlight {
      color: #fbbf24;
      display: block;
      font-size: 36px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      max-width: 400px;
      margin: 0 auto;
    }
    .content {
      padding: 40px 30px;
    }
    .invitation-box {
      background: linear-gradient(135deg, #f0f4ff 0%, #e9d5ff 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 30px;
      text-align: center;
      border: 2px solid #e0e7ff;
    }
    .invitation-box h2 {
      color: #4c1d95;
      font-size: 20px;
      margin-bottom: 8px;
    }
    .channel-name {
      font-size: 28px;
      font-weight: 800;
      color: #5b21b6;
      margin: 12px 0;
    }
    .inviter {
      color: #6b7280;
      font-size: 14px;
      margin-top: 8px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
    }
    .features {
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: start;
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .feature-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .feature-text {
      flex: 1;
    }
    .feature-text h3 {
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .feature-text p {
      font-size: 14px;
      color: #6b7280;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: #5b21b6;
      display: block;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer p {
      margin: 8px 0;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 20px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        border-radius: 0;
      }
      .header h1 {
        font-size: 24px;
      }
      .header .highlight {
        font-size: 28px;
      }
      .content {
        padding: 30px 20px;
      }
      .stats {
        flex-direction: column;
        gap: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Section -->
    <div class="header">
      <div class="badge">🎉 Join 1M+ Users Worldwide</div>
      <h1>
        Master Any Topic with<br>
        <span class="highlight">Interactive Quizzes</span>
      </h1>
      <p>Test your knowledge, track your progress, and compete with millions of learners worldwide!</p>
    </div>

    <!-- Content Section -->
    <div class="content">
      <!-- Invitation Box -->
      <div class="invitation-box">
        <h2>🎊 You've Been Invited!</h2>
        <div class="channel-name">${channelName}</div>
        ${inviterName ? `<p class="inviter">Invited by <strong>${inviterName}</strong></p>` : ''}
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${websiteUrl}" class="cta-button">
          Get Started Free →
        </a>
      </div>

      <!-- Features -->
      <div class="features">
        <div class="feature-item">
          <div class="feature-icon">✓</div>
          <div class="feature-text">
            <h3>Interactive Learning</h3>
            <p>Engage with dynamic quizzes designed to test and improve your knowledge</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-text">
            <h3>Track Your Progress</h3>
            <p>Monitor your performance with detailed analytics and insights</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🏆</div>
          <div class="feature-text">
            <h3>Compete & Excel</h3>
            <p>Challenge yourself and compete with learners around the world</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat-item">
          <span class="stat-number">1M+</span>
          <span class="stat-label">Active Users</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">50K+</span>
          <span class="stat-label">Quizzes</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">98%</span>
          <span class="stat-label">Satisfaction</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Alternative Link -->
      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        Button not working? Copy and paste this link into your browser:<br>
        <a href="${websiteUrl}" style="color: #667eea; word-break: break-all;">${websiteUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>Start your journey to excellence today!</p>
      <p>
        Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>
      </p>
      <p style="font-size: 12px; margin-top: 20px;">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    html,
    subject: `🎉 You're invited to join ${channelName}!`
  };
}

/**
 * Welcome Email Template
 */
export function getWelcomeEmailTemplate(
  username: string,
  options: EmailTemplateOptions = {}
): { html: string; subject: string } {
  const { websiteUrl, companyName } = { ...defaultOptions, ...options };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 50px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-message {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 Welcome, ${username}!</h1>
      <p>Your journey to excellence starts now</p>
    </div>
    <div class="content">
      <p class="welcome-message">
        Thank you for joining ${companyName}! We're excited to have you on board.
      </p>
      <p>
        Get started by exploring our interactive quizzes, tracking your progress, 
        and competing with learners worldwide.
      </p>
      <div style="text-align: center;">
        <a href="${websiteUrl}" class="cta-button">
          Start Learning →
        </a>
      </div>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    html,
    subject: `Welcome to ${companyName}, ${username}! 🎉`
  };
}

/**
 * Password Reset Email Template
 */
export function getPasswordResetEmailTemplate(
  resetUrl: string,
  username: string,
  options: EmailTemplateOptions = {}
): { html: string; subject: string } {
  const { companyName, supportEmail } = { ...defaultOptions, ...options };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 40px 30px;
    }
    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi ${username},</p>
      <p style="margin: 16px 0;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="cta-button">
          Reset Password
        </a>
      </div>
      <div class="warning-box">
        <strong>⚠️ Security Notice:</strong><br>
        This link will expire in 1 hour. If you didn't request this reset, please ignore this email 
        and contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>
      </div>
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Link not working? Copy and paste this URL into your browser:<br>
        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    html,
    subject: 'Reset Your Password - Action Required'
  };
}