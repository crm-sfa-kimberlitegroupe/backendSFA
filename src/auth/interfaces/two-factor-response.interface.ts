/**
 * Réponse pour la génération du QR code 2FA
 */
export interface TwoFactorSetupResponse {
  success: boolean;
  message: string;
  qrCode: string;
  secret: string;
}

/**
 * Réponse pour l'activation/désactivation du 2FA
 */
export interface TwoFactorResponse {
  success: boolean;
  message: string;
  twoFactorEnabled: boolean;
}

/**
 * Réponse pour la connexion nécessitant 2FA
 */
export interface TwoFactorRequiredResponse {
  success: false;
  message: string;
  requiresTwoFactor: true;
  tempToken?: string;
}
