export const jwtConstants = {
  // This is a fallback. The system prefers process.env.JWT_SECRET
  secret: 'SUPER_SECRET_FALLBACK_KEY_DO_NOT_USE_IN_PROD',
  expiresIn: '1d',
} as const;