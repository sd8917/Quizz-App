import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      locals?: Record<string, any>;
    }
  }
}

// Configure Google OAuth strategy for Passport
export const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  // Use full callback URL or construct it
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.warn('⚠️  Google OAuth environment variables are missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google login.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
        passReqToCallback: true
      },
      async (_req: Request, _accessToken: string, _refreshToken: string, profile: Profile, done) => {
        try {
          const authService = new AuthService();
          const userResponse = await authService.loginWithGoogle(profile);
          
            // Replace with logger
        //   console.log('[Passport Verify] ✅ User created/found with tokens:', {
        //     userId: userResponse._id,
        //     email: userResponse.email,
        //     hasAccessToken: !!userResponse.accessToken,
        //     hasRefreshToken: !!userResponse.refreshToken,
        //     accessTokenLen: userResponse.accessToken ? userResponse.accessToken.length : 0,
        //     refreshTokenLen: userResponse.refreshToken ? userResponse.refreshToken.length : 0
        //   });

          // Create user object WITH tokens attached
          const userWithTokens = {
            _id: userResponse._id,
            username: userResponse.username,
            email: userResponse.email,
            roles: userResponse.role ? [userResponse.role] : ['user'],
            accessToken: userResponse.accessToken,
            refreshToken: userResponse.refreshToken
          };

          return done(null, userWithTokens as any);
        } catch (err) {
          console.error('[Passport Verify] ❌ Error:', err);
          return done(err as Error, undefined);
        }
      }
    )
  );
};
