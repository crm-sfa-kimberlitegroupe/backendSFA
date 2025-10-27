/**
 * Interfaces TypeScript pour les territoires
 * Remplace les 'any' pour un code type-safe
 */

import { TerritoryLevelEnum, PotentielCommercialEnum, CategorieMarche, TypeZone } from '@prisma/client';

/**
 * Données complètes d'un territoire (retournées par l'API)
 */
export interface TerritoryResponse {
  id: string;
  code: string;
  name: string;
  level: TerritoryLevelEnum;
  
  // Informations géographiques
  regions: string[];
  communes: string[];
  villes: string[];
  quartiers: string[];
  codesPostaux: string[];
  lat?: number;
  lng?: number;
  
  // Informations démographiques
  population?: number;
  superficie?: number;
  densitePopulation?: number;
  
  // Informations commerciales
  potentielCommercial?: PotentielCommercialEnum;
  categorieMarche?: CategorieMarche;
  typeZone?: TypeZone;
  nombrePDVEstime?: number;
  tauxPenetration?: number;
  
  // Hiérarchie et admin
  parentId?: string | null;
  adminId?: string | null;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  
  // Métadonnées
  isActive: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un territoire
 */
export interface CreateTerritoryData {
  code: string;
  name: string;
  level?: TerritoryLevelEnum;
  
  // Optionnel : Géographie
  regions?: string[];
  communes?: string[];
  villes?: string[];
  quartiers?: string[];
  codesPostaux?: string[];
  lat?: number;
  lng?: number;
  
  // Optionnel : Démographie
  population?: number;
  superficie?: number;
  densitePopulation?: number;
  
  // Optionnel : Commercial
  potentielCommercial?: PotentielCommercialEnum;
  categorieMarche?: CategorieMarche;
  typeZone?: TypeZone;
  nombrePDVEstime?: number;
  tauxPenetration?: number;
  
  // Optionnel : Hiérarchie
  parentId?: string;
  adminId?: string;
  notes?: string;
}

/**
 * Données pour mettre à jour un territoire
 */
export interface UpdateTerritoryData {
  code?: string;
  name?: string;
  level?: TerritoryLevelEnum;
  
  regions?: string[];
  communes?: string[];
  villes?: string[];
  quartiers?: string[];
  codesPostaux?: string[];
  lat?: number;
  lng?: number;
  
  population?: number;
  superficie?: number;
  densitePopulation?: number;
  
  potentielCommercial?: PotentielCommercialEnum;
  categorieMarche?: CategorieMarche;
  typeZone?: TypeZone;
  nombrePDVEstime?: number;
  tauxPenetration?: number;
  
  parentId?: string;
  adminId?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Filtres pour la recherche de territoires
 */
export interface TerritoryFilters {
  level?: TerritoryLevelEnum;
  adminId?: string;
  parentId?: string;
  isActive?: boolean;
  region?: string;
  commune?: string;
}
