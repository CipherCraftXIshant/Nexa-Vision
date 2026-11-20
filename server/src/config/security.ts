export interface SecurityConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  clientUrl: string;
}

export const loadSecurityConfig = (env: NodeJS.ProcessEnv = process.env): SecurityConfig => {
  const jwtSecret = env.JWT_SECRET?.trim();
  const jwtRefreshSecret = env.JWT_REFRESH_SECRET?.trim();
  const missing = [!jwtSecret && 'JWT_SECRET', !jwtRefreshSecret && 'JWT_REFRESH_SECRET'].filter(Boolean);
  if (missing.length) throw new Error(`Missing required security configuration: ${missing.join(', ')}`);
  if (jwtSecret!.length < 32 || jwtRefreshSecret!.length < 32) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must each contain at least 32 characters.');
  }
  if (jwtSecret === jwtRefreshSecret) throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  if (env.NODE_ENV === 'production') {
    const productionMissing = [!env.MONGODB_URI && 'MONGODB_URI', !env.AI_SERVICE_URL && 'AI_SERVICE_URL', !env.CLIENT_URL && 'CLIENT_URL'].filter(Boolean);
    if (productionMissing.length) throw new Error(`Missing required production configuration: ${productionMissing.join(', ')}`);
  }
  return {
    jwtSecret: jwtSecret!,
    jwtRefreshSecret: jwtRefreshSecret!,
    accessTokenTtl: env.JWT_EXPIRES_IN || '15m',
    refreshTokenTtl: env.JWT_REFRESH_EXPIRES_IN || '7d',
    clientUrl: env.CLIENT_URL || 'http://localhost:5173'
  };
};

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export const isPublicRegistrationRole = (role: unknown): boolean => role === undefined || role === 'USER';

export const canUseRealtimeEvents = (role: string, isActive: boolean, hasSession: boolean): boolean =>
  isActive && hasSession && ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'].includes(role);

export const canAssignRole = (actorRole: string, targetRole: string, requestedRole?: string): boolean => {
  if (targetRole === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') return false;
  if (targetRole === 'ADMIN' && actorRole === 'ADMIN') return false;
  if (requestedRole === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') return false;
  if (actorRole === 'ADMIN' && (requestedRole === 'ADMIN' || requestedRole === 'SUPER_ADMIN')) return false;
  return ['USER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(actorRole) &&
    ['USER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(targetRole) &&
    (requestedRole === undefined || ['USER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(requestedRole));
};
import { createHash } from 'crypto';

