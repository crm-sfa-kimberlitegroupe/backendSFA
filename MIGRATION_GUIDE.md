# Guide de Migration - Nouvelle Structure Hiérarchique des Produits

## Contexte
L'ancienne structure SKU simple a été remplacée par une hiérarchie complète en 7 niveaux :
- Category → SubCategory → Brand → SubBrand → PackFormat → PackSize → SKU

## Modules affectés
1. **SKUsModule** (src/skus) - Désactivé temporairement
2. **VendorStockModule** (src/vendor-stock) - Désactivé temporairement

## Options de migration

### Option A : Migration avec préservation des données (PRODUCTION)

#### Étape 1 : Créer des catégories par défaut
```sql
-- Créer une catégorie par défaut pour les SKUs existants
INSERT INTO category (id, code, name, active) 
VALUES (gen_random_uuid(), 'DEFAULT', 'Catégorie par défaut', true);

-- Créer une sous-catégorie par défaut
INSERT INTO sub_category (id, code, name, category_id, active)
SELECT gen_random_uuid(), 'DEFAULT', 'Sous-catégorie par défaut', id, true
FROM category WHERE code = 'DEFAULT';

-- Créer une marque par défaut pour chaque brand existant
INSERT INTO brand (id, code, name, sub_category_id, active)
SELECT 
  gen_random_uuid(),
  COALESCE(brand, 'UNKNOWN'),
  COALESCE(brand, 'Marque inconnue'),
  (SELECT id FROM sub_category WHERE code = 'DEFAULT'),
  true
FROM sku
WHERE brand IS NOT NULL
GROUP BY brand;

-- Créer une sous-marque par défaut
INSERT INTO sub_brand (id, code, name, brand_id, active)
SELECT 
  gen_random_uuid(),
  'DEFAULT',
  'Sous-marque par défaut',
  b.id,
  true
FROM brand b;

-- Créer un format de packaging par défaut
INSERT INTO pack_format (id, code, name, sub_brand_id, active)
SELECT 
  gen_random_uuid(),
  'DEFAULT',
  'Format standard',
  sb.id,
  true
FROM sub_brand sb;

-- Créer une taille de packaging par défaut
INSERT INTO pack_size (id, code, name, pack_format_id, active)
SELECT 
  gen_random_uuid(),
  'DEFAULT',
  'Taille standard',
  pf.id,
  true
FROM pack_format pf;
```

#### Étape 2 : Migrer les SKUs existants
```sql
-- Ajouter les nouveaux champs aux SKUs existants
UPDATE sku s
SET 
  code = COALESCE(s.ean, 'SKU-' || s.id),
  short_description = COALESCE(s.name, 'Produit'),
  full_description = COALESCE(s.description, s.name, 'Produit'),
  price_ttc = s.price_ht * (1 + s.vat_rate / 100),
  pack_size_id = (
    SELECT ps.id 
    FROM pack_size ps
    JOIN pack_format pf ON ps.pack_format_id = pf.id
    JOIN sub_brand sb ON pf.sub_brand_id = sb.id
    JOIN brand b ON sb.brand_id = b.id
    WHERE b.name = COALESCE(s.brand, 'Marque inconnue')
    LIMIT 1
  )
WHERE pack_size_id IS NULL;

-- Supprimer les anciennes colonnes (après vérification)
-- ALTER TABLE sku DROP COLUMN name;
-- ALTER TABLE sku DROP COLUMN brand;
-- ALTER TABLE sku DROP COLUMN category;
-- ALTER TABLE sku DROP COLUMN description;
```

### Option B : Reset complet (DÉVELOPPEMENT)

Si vous êtes en développement et n'avez pas de données importantes :

```bash
# Déjà fait avec --force-reset
npx prisma db push --force-reset
npx prisma generate
```

## Refactorisation des modules

### 1. VendorStockModule

Le module VendorStock doit être adapté pour :
- Utiliser la nouvelle structure SKU avec relations
- Afficher les informations hiérarchiques (catégorie, marque, etc.)

**Fichiers à modifier :**
- `src/vendor-stock/vendor-stock.service.ts` (✓ Partiellement fait)
- `src/vendor-stock/vendor-stock.controller.ts`
- `src/vendor-stock/dto/*.dto.ts`

**Changements principaux :**
```typescript
// Ancien
sku: {
  name: string;
  brand: string;
  category: string;
}

// Nouveau
sku: {
  shortDescription: string;
  packSize: {
    packFormat: {
      subBrand: {
        name: string;
        brand: {
          name: string;
          subCategory: {
            category: {
              name: string;
            }
          }
        }
      }
    }
  }
}
```

### 2. SKUsModule

Ce module est **remplacé** par **ProductsModule** qui offre :
- Gestion complète de la hiérarchie
- Endpoints plus riches
- Meilleure organisation

**Action recommandée :** Supprimer définitivement l'ancien module après migration.

## Plan d'action recommandé

### Phase 1 : Développement (Maintenant)
- [x] Désactiver les anciens modules
- [x] Créer la nouvelle structure
- [x] Tester les nouveaux endpoints
- [ ] Refactoriser VendorStockModule
- [ ] Créer des seeders pour données de test

### Phase 2 : Tests
- [ ] Créer des données de test complètes
- [ ] Tester tous les endpoints
- [ ] Valider les relations hiérarchiques
- [ ] Tester les promotions

### Phase 3 : Production
- [ ] Créer un script de migration SQL
- [ ] Backup de la base de données
- [ ] Exécuter la migration
- [ ] Valider les données migrées
- [ ] Déployer le nouveau code

## Commandes utiles

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name migration_name

# Appliquer les migrations en production
npx prisma migrate deploy

# Reset complet (développement uniquement)
npx prisma db push --force-reset

# Voir l'état des migrations
npx prisma migrate status
```

## Seeders recommandés

Créer des données de test pour :
1. Hiérarchie complète (Category → SKU)
2. Groupes SKU avec mappings
3. Promotions actives
4. Stock vendeur avec nouvelle structure

## Support

Pour toute question sur la migration, référez-vous à :
- `IMPLEMENTATION.md` - Spécifications complètes
- `prisma/schema.prisma` - Structure de la base de données
- `src/products/` - Nouveaux services et controllers
