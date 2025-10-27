-- Migration: Transformer les champs géographiques en tableaux
-- Créé le: 2025-01-26

-- Étape 1: Créer les nouvelles colonnes en tant que tableaux
ALTER TABLE "territory" ADD COLUMN IF NOT EXISTS "regions" TEXT[] DEFAULT '{}';
ALTER TABLE "territory" ADD COLUMN IF NOT EXISTS "communes" TEXT[] DEFAULT '{}';
ALTER TABLE "territory" ADD COLUMN IF NOT EXISTS "villes" TEXT[] DEFAULT '{}';
ALTER TABLE "territory" ADD COLUMN IF NOT EXISTS "quartiers" TEXT[] DEFAULT '{}';
ALTER TABLE "territory" ADD COLUMN IF NOT EXISTS "codes_postaux" TEXT[] DEFAULT '{}';

-- Étape 2: Migrer les données existantes (si elles existent)
UPDATE "territory" SET "regions" = ARRAY[region] WHERE region IS NOT NULL AND region != '';
UPDATE "territory" SET "communes" = ARRAY[commune] WHERE commune IS NOT NULL AND commune != '';
UPDATE "territory" SET "villes" = ARRAY[ville] WHERE ville IS NOT NULL AND ville != '';
UPDATE "territory" SET "quartiers" = ARRAY[quartier] WHERE quartier IS NOT NULL AND quartier != '';
UPDATE "territory" SET "codes_postaux" = ARRAY[code_postal] WHERE code_postal IS NOT NULL AND code_postal != '';

-- Étape 3: Supprimer les anciennes colonnes
ALTER TABLE "territory" DROP COLUMN IF EXISTS "region";
ALTER TABLE "territory" DROP COLUMN IF EXISTS "commune";
ALTER TABLE "territory" DROP COLUMN IF EXISTS "ville";
ALTER TABLE "territory" DROP COLUMN IF EXISTS "quartier";
ALTER TABLE "territory" DROP COLUMN IF EXISTS "code_postal";

-- Étape 4: Les index sur region et commune ont déjà été supprimés dans le schema
