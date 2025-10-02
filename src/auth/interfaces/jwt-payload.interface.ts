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
   * Timestamp de création du token
   */
  iat?: number;

  /**
   * Timestamp d'expiration du token
   */
  exp?: number;
}
