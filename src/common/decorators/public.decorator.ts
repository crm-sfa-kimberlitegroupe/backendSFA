import { SetMetadata } from '@nestjs/common';

/**
 * Clé de métadonnées pour les routes publiques
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Décorateur pour marquer les routes comme publiques (pas d'authentification requise)
 * Utilisation: @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
