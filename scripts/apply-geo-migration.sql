-- Migration pour synchroniser les colonnes géographiques
-- À exécuter manuellement sur la base de données

-- Vérifier si les colonnes existent déjà
DO $$
BEGIN
  -- Créer les nouvelles colonnes en tant que tableaux si elles n'existent pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'territory' AND column_name = 'regions') THEN
    ALTER TABLE "territory" ADD COLUMN "regions" TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'territory' AND column_name = 'communes') THEN
    ALTER TABLE "territory" ADD COLUMN "communes" TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'territory' AND column_name = 'villes') THEN
    ALTER TABLE "territory" ADD COLUMN "villes" TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'territory' AND column_name = 'quartiers') THEN
    ALTER TABLE "territory" ADD COLUMN "quartiers" TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'territory' AND column_name = 'codes_postaux') THEN
    ALTER TABLE "territory" ADD COLUMN "codes_postaux" TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Migrer les données existantes depuis les anciennes colonnes
UPDATE "territory" SET "regions" = ARRAY[region] WHERE region IS NOT NULL AND region != '' AND (regions IS NULL OR array_length(regions, 1) IS NULL);
UPDATE "territory" SET "communes" = ARRAY[commune] WHERE commune IS NOT NULL AND commune != '' AND (communes IS NULL OR array_length(communes, 1) IS NULL);
UPDATE "territory" SET "villes" = ARRAY[ville] WHERE ville IS NOT NULL AND ville != '' AND (villes IS NULL OR array_length(villes, 1) IS NULL);
UPDATE "territory" SET "quartiers" = ARRAY[quartier] WHERE quartier IS NOT NULL AND quartier != '' AND (quartiers IS NULL OR array_length(quartiers, 1) IS NULL);
UPDATE "territory" SET "codes_postaux" = ARRAY[code_postal] WHERE code_postal IS NOT NULL AND code_postal != '' AND (codes_postaux IS NULL OR array_length(codes_postaux, 1) IS NULL);

-- Supprimer les anciennes colonnes une fois la migration terminée (décommentez si vous êtes sûr)
-- ALTER TABLE "territory" DROP COLUMN IF EXISTS "region";
-- ALTER TABLE "territory" DROP COLUMN IF EXISTS "commune";
-- ALTER TABLE "territory" DROP COLUMN IF EXISTS "ville";
-- ALTER TABLE "territory" DROP COLUMN IF EXISTS "quartier";
-- ALTER TABLE "territory" DROP COLUMN IF EXISTS "code_postal";
