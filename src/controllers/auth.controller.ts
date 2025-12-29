import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ValidationError as AppValidationError, AuthenticationError as AppAuthError } from '../utils/errors';
import { sendSuccess, sendCreated } from '../utils/helper';

// Initialize auth service
const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    const user = await authService.register(userData);

    // Set refresh token in HTTP-only cookie
    const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '30', 10);
    const maxAge = (isNaN(expiryDays) ? 30 : Math.max(1, expiryDays)) * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "none",
      maxAge,
    });

    // Remove refreshToken from response body
    const responseUser = { ...user };
    delete responseUser.refreshToken;

    sendCreated(res, responseUser, 'User registered successfully');
  } catch (error: any) {
    // Let centralized handler format Mongoose validation errors
    if (error && error.name === 'ValidationError') {
      return next(error);
    }

    // Map known service errors to App errors so middleware returns proper codes
    if (error && error.message === 'User already exists') {
      return next(new AppValidationError(error.message));
    }

    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const credentials = {
      email: req.body.email,
      password: req.body.password,
    };

    const user = await authService.login(credentials);

     // Set refresh token in HTTP-only cookie
    const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '30', 10);
    const maxAge = (isNaN(expiryDays) ? 30 : Math.max(1, expiryDays)) * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',        // ❗ must be false on http
      sameSite: "none",      // ✅ works for localhost
      maxAge
    });

    // Do not sent refresh token in response
    delete user.refreshToken;
    
    sendSuccess(res, user, 'Login successful');
  } catch (error: any) {
    if (error && error.message === 'Invalid credentials') {
      return next(new AppAuthError(error.message));
    }

    return next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Read refresh token from HTTP-only cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppAuthError('Refresh token is required'));
    }

    const result = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error: any) {
    if (error && (error.message === 'Invalid refresh token' || error.message === 'Refresh token expired')) {
      return next(new AppAuthError(error.message));
    }

    return next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Read refresh token from HTTP-only cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppValidationError('Refresh token is required'));
    }

    await authService.logout(refreshToken);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',        // ❗ must be false on http
      sameSite: "none",      // ✅ works for localhost
    });

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error: any) {
    return next(error);
  }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId =( req.user as any)?.id || (req.user as any)?._id;

    if (!userId) {
      return next(new AppAuthError('User not authenticated'));
    }

    await authService.logoutAll(userId);
    sendSuccess(res, null, 'Logged out from all devices');
  } catch (error: any) {
    return next(error);
  }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppValidationError('Email is required'));
    }

    // Get IP address and user agent for security tracking
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.requestPasswordReset(email, ipAddress, userAgent);
    sendSuccess(res, null, result.message);
  } catch (error: any) {
    return next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return next(new AppValidationError('Token and new password are required'));
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return next(new AppValidationError('Password must be at least 6 characters long'));
    }

    const result = await authService.resetPassword(token, newPassword);
    sendSuccess(res, null, result.message);
  } catch (error: any) {
    if (error && error.message === 'Invalid or expired reset token') {
      return next(new AppAuthError(error.message));
    }

    if (error && error.message === 'Account is deactivated') {
      return next(new AppAuthError(error.message));
    }

    return next(error);
  }
};

export const verifyResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return next(new AppValidationError('Token is required'));
    }

    const result = await authService.verifyResetToken(token);
    
    if (!result.valid) {
      return next(new AppAuthError('Invalid or expired reset token'));
    }

    sendSuccess(res, { email: result.email }, 'Token is valid');
  } catch (error: any) {
    return next(error);
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    let user = req.user as any;

    if (!user) {
      console.error('[Google Callback] ❌ NO USER OBJECT');
      res.status(401).send('Authentication failed: No user');
      return;
    }

    if (!user.accessToken || !user.refreshToken) {
      console.error('[Google Callback] ❌ MISSING TOKENS');
      console.error('[Google Callback] User keys:', Object.keys(user));
      res.status(401).send('Authentication failed: Missing tokens');
      return;
    }

    // Set refresh token in HTTP-only cookie
    const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '30', 10);
    const maxAge = (isNaN(expiryDays) ? 30 : Math.max(1, expiryDays)) * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',        // ❗ must be false on http
      sameSite: "none",      // ✅ works for localhost
      maxAge,
    });

    // Redirect to frontend with only access token in query parameters
    // This bypasses CSP inline script issues
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const redirectUrl = `${frontendUrl}/auth/google/callback?accessToken=${encodeURIComponent(user.accessToken)}&email=${encodeURIComponent(user.email)}&username=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user?.roles[0])}`;
    // Redirect the popup to the frontend callback URL
    // Frontend will extract access token from URL and store it, refresh token is in cookie
    res.redirect(redirectUrl);

  } catch (error: any) {
    console.error('[Google Callback] ❌ ERROR:', error);
    res.status(500).send('Server error: ' + error.message);
  }
};
