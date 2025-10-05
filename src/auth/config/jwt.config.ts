import { JwtModuleOptions } from '@nestjs/jwt';
import { AUTH_CONSTANTS } from '../constants';

/**
 * Factory de configuration JWT
 * @returns Options du module JWT
 */
export const getJwtConfig = (): JwtModuleOptions => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.warn(
      "  JWT_SECRET non trouvé dans les variables d'environnement. Utilisation du secret par défaut (NON RECOMMANDÉ EN PRODUCTION)",
    );
  }

  return {
    secret: secret || 'votre-secret-jwt-super-securise-changez-moi',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRATION || AUTH_CONSTANTS.JWT_EXPIRATION,
    },
  };
};
