import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../../config/env';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export const configureGoogleOAuth = () => {
  if (config.google.clientId && config.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientId,
          clientSecret: config.google.clientSecret,
          callbackURL: config.google.callbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const googleId = profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            const name = profile.displayName || email.split('@')[0];
            const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

            let user = await prisma.user.findUnique({
              where: { googleId },
            });

            if (!user) {
              user = await prisma.user.findUnique({
                where: { email },
              });

              if (user) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { googleId, avatarUrl: avatarUrl || user.avatarUrl },
                });
              } else {
                user = await prisma.user.create({
                  data: {
                    googleId,
                    email,
                    name,
                    avatarUrl,
                  },
                });
              }
            }

            return done(null, user);
          } catch (error) {
            logger.error({ error }, 'Google OAuth strategy error');
            return done(error as Error, undefined);
          }
        }
      )
    );
    logger.info('Google OAuth strategy configured');
  } else {
    logger.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing. Real Google OAuth is disabled until credentials are provided.');
  }
};
