/**
 * Exceptions métier personnalisées pour une meilleure gestion des erreurs
 * Pattern : Utiliser des exceptions spécifiques plutôt que des BadRequestException génériques
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Exception lancée quand un ADMIN tente de gérer plus d'un territoire
 */
export class AdminAlreadyHasTerritoryException extends BadRequestException {
  constructor(adminName: string, existingTerritoryName: string) {
    super(
      `${adminName} gère déjà le territoire "${existingTerritoryName}". Un administrateur ne peut gérer qu'un seul territoire à la fois.`,
    );
  }
}

/**
 * Exception lancée quand on tente d'assigner un manager invalide
 */
export class InvalidManagerException extends BadRequestException {
  constructor(reason: string) {
    super(`Assignation de manager invalide : ${reason}`);
  }
}

/**
 * Exception lancée quand un territoire n'a pas d'admin assigné
 */
export class TerritoryHasNoAdminException extends BadRequestException {
  constructor(territoryName: string) {
    super(
      `Le territoire "${territoryName}" n'a pas d'administrateur assigné. Impossible de procéder.`,
    );
  }
}

/**
 * Exception lancée quand un user n'a pas les permissions pour une action
 */
export class InsufficientPermissionsException extends BadRequestException {
  constructor(action: string, requiredRole: string) {
    super(
      `Permission insuffisante pour ${action}. Rôle requis : ${requiredRole}`,
    );
  }
}

/**
 * Exception lancée quand un territoire n'existe pas
 */
export class TerritoryNotFoundException extends NotFoundException {
  constructor(territoryId: string) {
    super(
      `Territoire avec l'ID ${territoryId} introuvable. Il a peut-être été supprimé.`,
    );
  }
}

/**
 * Exception lancée quand un user n'existe pas
 */
export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(
      `Utilisateur avec l'ID ${userId} introuvable. Il a peut-être été désactivé.`,
    );
  }
}

/**
 * Exception lancée quand une opération créerait une incohérence de données
 */
export class DataIntegrityException extends BadRequestException {
  constructor(message: string, details?: string) {
    const fullMessage = details
      ? `${message}. Détails: ${details}`
      : message;
    super(fullMessage);
  }
}

/**
 * Exception lancée quand un REP tente d'accéder à un PDV hors de son secteur
 */
export class OutletNotInSectorException extends BadRequestException {
  constructor(outletName: string, sectorName: string) {
    super(
      `Le point de vente "${outletName}" n'est pas dans votre secteur "${sectorName}".`,
    );
  }
}

/**
 * Exception lancée quand une ressource est déjà utilisée
 */
export class ResourceAlreadyInUseException extends BadRequestException {
  constructor(resourceType: string, resourceName: string, usedBy: string) {
    super(
      `${resourceType} "${resourceName}" est déjà utilisé(e) par ${usedBy}.`,
    );
  }
}
