export const jwtConstants = {
  // In production, this must come from .env.
  secret: 'SUPER_SECRET_KEY_12345_DO_NOT_SHARE', 
  expiresIn: '1d',
} as const; // <--- FIX: "as const" ensures strict typing for '1d'