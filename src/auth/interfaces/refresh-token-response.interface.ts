/**
 * Réponse pour le rafraîchissement de token
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
}
