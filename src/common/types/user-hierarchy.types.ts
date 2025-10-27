/**
 * Types TypeScript stricts pour la hiérarchie utilisateur
 * Améliore la maintenabilité et évite les erreurs de logique métier
 */

import { RoleEnum } from '@prisma/client';

/**
 * Représente un utilisateur avec son manager (relation hiérarchique)
 */
export interface UserWithManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleEnum;
  managerId: string | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    role: RoleEnum;
  } | null;
}

/**
 * Représente un utilisateur avec ses subordonnés
 */
export interface UserWithSubordinates {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleEnum;
  subordinates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: RoleEnum;
  }>;
}

/**
 * Représente l'arbre hiérarchique complet
 */
export interface HierarchyNode {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: RoleEnum;
    email: string;
  };
  children: HierarchyNode[];
  level: number; // 0 = SUP, 1 = ADMIN, 2 = REP
}

/**
 * Résultat de validation d'assignation de manager
 */
export interface ManagerValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedManagerRole?: RoleEnum;
}

/**
 * Type guard pour vérifier si un user peut être manager d'un autre
 */
export function canBeManager(
  managerRole: RoleEnum,
  subordinateRole: RoleEnum,
): boolean {
  const validCombinations: Record<RoleEnum, RoleEnum[]> = {
    SUP: [RoleEnum.ADMIN, RoleEnum.REP], // SUP peut manager ADMIN et REP
    ADMIN: [RoleEnum.REP], // ADMIN peut manager REP uniquement
    REP: [], // REP ne peut manager personne
  };

  return validCombinations[managerRole]?.includes(subordinateRole) ?? false;
}

/**
 * Valide qu'un manager peut être assigné à un subordonné
 */
export function validateManagerAssignment(
  managerId: string,
  managerRole: RoleEnum,
  subordinateId: string,
  subordinateRole: RoleEnum,
): ManagerValidationResult {
  // Un user ne peut pas être son propre manager
  if (managerId === subordinateId) {
    return {
      isValid: false,
      reason: 'Un utilisateur ne peut pas être son propre manager',
    };
  }

  // Vérifier la hiérarchie des rôles
  if (!canBeManager(managerRole, subordinateRole)) {
    const suggestedRole =
      subordinateRole === RoleEnum.ADMIN ? RoleEnum.SUP : RoleEnum.ADMIN;

    return {
      isValid: false,
      reason: `Un ${managerRole} ne peut pas manager un ${subordinateRole}`,
      suggestedManagerRole: suggestedRole,
    };
  }

  return { isValid: true };
}

/**
 * Extrait tous les IDs des subordonnés (récursif)
 */
export function extractSubordinateIds(node: HierarchyNode): string[] {
  const ids: string[] = [node.user.id];

  for (const child of node.children) {
    ids.push(...extractSubordinateIds(child));
  }

  return ids;
}

/**
 * Construit l'arbre hiérarchique à partir d'une liste plate d'utilisateurs
 */
export function buildHierarchyTree(
  users: UserWithManager[],
  rootManagerId?: string,
): HierarchyNode[] {
  const roots: HierarchyNode[] = [];

  // Créer les noeuds
  const nodes = new Map<string, HierarchyNode>();
  for (const user of users) {
    nodes.set(user.id, {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
      },
      children: [],
      level: getRoleLevel(user.role),
    });
  }

  // Construire l'arbre
  for (const user of users) {
    const node = nodes.get(user.id)!;

    if (rootManagerId) {
      // Si on cherche une hiérarchie spécifique
      if (user.managerId === rootManagerId) {
        const parent = nodes.get(rootManagerId);
        if (parent) {
          parent.children.push(node);
        }
      }
    } else {
      // Construire l'arbre complet
      if (user.managerId && nodes.has(user.managerId)) {
        const parent = nodes.get(user.managerId)!;
        parent.children.push(node);
      } else {
        // Pas de parent = racine
        roots.push(node);
      }
    }
  }

  return roots;
}

/**
 * Obtient le niveau hiérarchique d'un rôle
 */
function getRoleLevel(role: RoleEnum): number {
  const levels: Record<RoleEnum, number> = {
    SUP: 0,
    ADMIN: 1,
    REP: 2,
  };
  return levels[role] ?? 999;
}

/**
 * Formate le nom complet d'un utilisateur
 */
export function formatUserFullName(user: {
  firstName: string;
  lastName: string;
}): string {
  return `${user.firstName} ${user.lastName}`;
}

/**
 * Obtient le rôle en français
 */
export function getRoleFrench(role: RoleEnum): string {
  const roles: Record<RoleEnum, string> = {
    SUP: 'Superviseur',
    ADMIN: 'Administrateur',
    REP: 'Représentant',
  };
  return roles[role] ?? role;
}
