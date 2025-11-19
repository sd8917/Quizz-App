import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser, ILoginRequest, IRegisterRequest, IUserResponse } from '../types';
import User from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';

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
      ...(refreshToken && { refreshToken })
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
}