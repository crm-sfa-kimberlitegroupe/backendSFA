-- Migration: Renommer la colonne employee_id en matricule
-- Date: 2025-10-31

-- Renommer la colonne employee_id en matricule dans la table user
ALTER TABLE "user" RENAME COLUMN "employee_id" TO "matricule";
