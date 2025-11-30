//Constantes liées à l'authentification

export const AUTH_CONSTANTS = {
  //Nom de la stratégie JWT utilisée par Passport
  JWT_STRATEGY: 'jwt',

  //Durée d'expiration par défaut du JWT (8 heures - journée de travail)
  JWT_EXPIRATION: '10h',

  //Durée d'expiration du refresh token (7 jours)
  REFRESH_TOKEN_EXPIRATION: '7d',

  //Longueur minimale du mot de passe
  MIN_PASSWORD_LENGTH: 8,

  //Longueur maximale du mot de passe
  MAX_PASSWORD_LENGTH: 128,

  // SCRUM-39: Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION_MINUTES: 30,
  LOGIN_ATTEMPTS_WINDOW_MINUTES: 15,

  // SCRUM-38: Reset password
  RESET_TOKEN_EXPIRATION_HOURS: 1,

  // SCRUM-40: 2FA
  TWO_FACTOR_APP_NAME: 'SFA CRM',
} as const;

//Messages d'erreur d'authentification
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
  UNAUTHORIZED: 'Non autorisé',
  TOKEN_EXPIRED: 'Token expiré',
  INVALID_TOKEN: 'Token invalide',
  ACCOUNT_LOCKED:
    'Compte temporairement verrouillé suite à plusieurs tentatives échouées',
  INVALID_RESET_TOKEN: 'Token de réinitialisation invalide ou expiré',
  INVALID_2FA_CODE: 'Code 2FA invalide',
  TWO_FACTOR_REQUIRED: 'Code 2FA requis',
  TWO_FACTOR_NOT_ENABLED: '2FA non activé',
  TWO_FACTOR_ALREADY_ENABLED: '2FA déjà activé',
  INVALID_REFRESH_TOKEN: 'Refresh token invalide ou expiré',
  EMAIL_NOT_VERIFIED: 'Email non vérifié',
  INVALID_VERIFICATION_TOKEN: 'Token de vérification invalide',
} as const;

//Messages de succès d'authentification
export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'Inscription réussie',
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  PASSWORD_RESET_EMAIL_SENT: 'Email de réinitialisation envoyé',
  PASSWORD_RESET_SUCCESS: 'Mot de passe réinitialisé avec succès',
  TWO_FACTOR_ENABLED: '2FA activé avec succès',
  TWO_FACTOR_DISABLED: '2FA désactivé avec succès',
  TWO_FACTOR_VERIFIED: 'Code 2FA vérifié',
  TOKEN_REFRESHED: 'Token rafraîchi avec succès',
  EMAIL_VERIFICATION_SENT: 'Email de vérification envoyé',
  EMAIL_VERIFIED: 'Email vérifié avec succès',
} as const;
