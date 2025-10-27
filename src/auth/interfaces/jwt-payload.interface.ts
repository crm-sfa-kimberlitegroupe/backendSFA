/**
 * Interface représentant le payload du token JWT
 */
export interface JwtPayload {
  /**
   * ID de l'utilisateur (subject)
   */
  sub: string;

  /**
   * Email de l'utilisateur
   */
  email: string;

  /**
   * Rôle de l'utilisateur (ADMIN, SUP, REP)
   */
  role: string;

  /**
   * ID du territoire de l'utilisateur (optionnel, NULL pour les SUP)
   */
  territoryId?: string;

  /**
   * Timestamp de création du token
   */
  iat?: number;

  /**
   * Timestamp d'expiration du token
   */
  exp?: number;
}
