import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser, ILoginRequest, IRegisterRequest, IUserResponse } from '../types';
import User from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { PasswordReset } from '../models/passwordReset.model';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/mailer';

export class AuthService {
  // Generate access token (5 minutes)
  private static generateAccessToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions['expiresIn'],
    });
  }

  // Generate refresh token (30 days) and store in DB
  private static async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRY || '30')); // 30 days from now

    await RefreshToken.create({
      userId,
      token,
      expiresAt,
      isRevoked: false
    });

    return token;
  }

  private static formatUserResponse(user: IUser, accessToken?: string, refreshToken?: string): IUserResponse {
    return {
      _id: (user._id as string).toString(),
      username: user.username,
      email: user.email,
      role: user.roles[0],
      ...(accessToken && { accessToken }),
      ...(refreshToken && { refreshToken }),
      lastLoginAt: user.lastLoginAt,
      lastActiveAt: user.lastActiveAt,
      activeStatus: user.getActiveStatus()
    };
  }

  async register(userData: IRegisterRequest): Promise<IUserResponse> {
    
    const { username, email, password } = userData;

    // Check if user exists
    const userExists = await User.findOne({ $and: [{ email }, { name: username }] });
    if (userExists) {
      throw new Error('User already exists');
    }

    // Create user with correct fields and default role
    const user = await User.create({
      username,
      email,
      password,
      roles: ['user'],
    });

    // Send welcome email asynchronously (don't block registration)
    sendWelcomeEmail(user.email, user.username).catch((err: any) => {
      console.error('Failed to send welcome email:', err);
    });

    const accessToken = AuthService.generateAccessToken((user._id as string).toString());
    const refreshToken = await AuthService.generateRefreshToken((user._id as string).toString());
    return AuthService.formatUserResponse(user, accessToken, refreshToken);
  }

  async login(credentials: ILoginRequest): Promise<IUserResponse> {
    const { email, password } = credentials;

    // Find user and validate
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Update login timestamp and last active
    const now = new Date();
    user.lastLoginAt = now;
    user.lastActiveAt = now;
    await user.save();

    const accessToken = AuthService.generateAccessToken((user._id as string).toString());
    const refreshToken = await AuthService.generateRefreshToken((user._id as string).toString());
    return AuthService.formatUserResponse(user, accessToken, refreshToken);
  }

  async getUserById(id: string): Promise<IUserResponse> {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return AuthService.formatUserResponse(user);
  }

  async refreshAccessToken(refreshTokenString: string): Promise<{ accessToken: string }> {
    // Find refresh token in database
    const refreshToken = await RefreshToken.findOne({ 
      token: refreshTokenString,
      isRevoked: false 
    });

    if (!refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      throw new Error('Refresh token expired');
    }

    // Generate new access token
    const accessToken = AuthService.generateAccessToken(refreshToken.userId.toString());
    
    return { accessToken };
  }

  async logout(refreshTokenString: string): Promise<void> {
    // Revoke the refresh token
    await RefreshToken.updateOne(
      { token: refreshTokenString },
      { isRevoked: true }
    );
  }

  async logoutAll(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  /**
   * Request password reset - generates token and sends email
   * Security measures:
   * - Rate limiting at controller level
   * - Secure random token (32 bytes)
   * - 1-hour expiration
   * - Single-use tokens
   * - Tracks IP and user agent
   * - Always returns success (prevents email enumeration)
   */
  async requestPasswordReset(
    email: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{ message: string }> {
    // Find user by email
    const user = await User.findOne({ email });
    
    // IMPORTANT: Always return success to prevent email enumeration attacks
    // Don't reveal whether the email exists or not
    if (!user) {
      return { 
        message: 'If your email is registered, you will receive a password reset link shortly.' 
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return { 
        message: 'If your email is registered, you will receive a password reset link shortly.' 
      };
    }

    // Invalidate any existing unused tokens for this user
    await PasswordReset.updateMany(
      { userId: user._id, isUsed: false },
      { isUsed: true }
    );

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing (add extra security layer)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Create reset record with 1-hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await PasswordReset.create({
      userId: user._id,
      token: hashedToken,
      expiresAt,
      isUsed: false,
      ipAddress,
      userAgent
    });

    // Build reset URL with original (unhashed) token
    const resetUrl = `${process.env.WEBSITE_URL || 'http://localhost:8000/api'}/reset-password?token=${resetToken}`;

    // Send email asynchronously (don't block response)
    sendPasswordResetEmail(user.email, user.username, resetUrl).catch((err: any) => {
      console.error('Failed to send password reset email:', err);
    });

    return { 
      message: 'If your email is registered, you will receive a password reset link shortly.' 
    };
  }

  /**
   * Reset password using token
   * Security measures:
   * - Token validation and expiration check
   * - Single-use tokens
   * - Password strength validation at controller level
   * - Invalidates all refresh tokens (logs out all devices)
   */
  async resetPassword(
    token: string, 
    newPassword: string
  ): Promise<{ message: string }> {
    // Hash the token to match what's stored in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      token: hashedToken,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Get user
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetRecord.isUsed = true;
    await resetRecord.save();

    // Revoke all refresh tokens (log out from all devices for security)
    await RefreshToken.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true }
    );

    return { 
      message: 'Password reset successful. Please login with your new password.' 
    };
  }

  /**
   * Verify reset token validity without using it
   * Useful for frontend to check if token is valid before showing form
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordReset.findOne({
      token: hashedToken,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'email');

    if (!resetRecord) {
      return { valid: false };
    }

    const user = resetRecord.userId as any;
    return { 
      valid: true, 
      email: user.email 
    };
  }
}