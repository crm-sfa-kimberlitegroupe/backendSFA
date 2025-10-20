/**
 * Interface pour les métadonnées OpenStreetMap (OSM)
 */
export interface OsmMetadata {
  // Identifiants OSM
  osmId?: string;
  osmType?: string; // node, way, relation

  // Informations de base
  displayName?: string;
  placeType?: string;
  category?: string;
  type?: string;

  // Coordonnées
  latitude?: number;
  longitude?: number;
  boundingBox?: number[];

  // Informations de contact
  phone?: string;
  website?: string;
  email?: string;

  // Horaires
  openingHours?: string;

  // Adresse détaillée
  houseNumber?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;

  // Tags OSM additionnels
  tags?: Record<string, string>;

  // Métadonnées supplémentaires
  importance?: number;
  placeRank?: number;
  addressType?: string;

  // Permet d'ajouter d'autres propriétés non définies
  [key: string]: unknown;
}
