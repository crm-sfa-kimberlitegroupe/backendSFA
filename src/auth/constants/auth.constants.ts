/**
 * Constantes liées à l'authentification
 */
export const AUTH_CONSTANTS = {
  /**
   * Nom de la stratégie JWT utilisée par Passport
   */
  JWT_STRATEGY: 'jwt',

  /**
   * Durée d'expiration par défaut du JWT
   */
  JWT_EXPIRATION: '24h',

  /**
   * Durée d'expiration du refresh token
   */
  REFRESH_TOKEN_EXPIRATION: '7d',

  /**
   * Longueur minimale du mot de passe
   */
  MIN_PASSWORD_LENGTH: 8,

  /**
   * Longueur maximale du mot de passe
   */
  MAX_PASSWORD_LENGTH: 128,
} as const;

/**
 * Messages d'erreur d'authentification
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
  UNAUTHORIZED: 'Non autorisé',
  TOKEN_EXPIRED: 'Token expiré',
  INVALID_TOKEN: 'Token invalide',
} as const;

/**
 * Messages de succès d'authentification
 */
export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'Inscription réussie',
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
} as const;
