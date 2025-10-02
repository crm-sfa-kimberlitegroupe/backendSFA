# Configuration Prisma - SFA Backend

## 📋 Prérequis

- PostgreSQL installé et en cours d'exécution
- Node.js et npm installés

## 🚀 Installation

Les dépendances Prisma sont déjà installées :
- `@prisma/client` - Client Prisma pour les requêtes
- `prisma` - CLI Prisma pour les migrations

## ⚙️ Configuration

### 1. Configurer la base de données

Créez un fichier `.env` à la racine du projet (copiez `.env.example`) :

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sfa_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
```

### 2. Créer la base de données PostgreSQL

```bash
# Connectez-vous à PostgreSQL
psql -U postgres

# Créez la base de données
CREATE DATABASE sfa_db;

# Quittez psql
\q
```

### 3. Générer le client Prisma

```bash
npm run prisma:generate
```

### 4. Créer et appliquer les migrations

```bash
npm run prisma:migrate
```

Vous serez invité à nommer votre migration (ex: "init", "add_tables", etc.)

### 5. (Optionnel) Remplir la base avec des données de test

```bash
npm run prisma:seed
```

## 📚 Scripts disponibles

- `npm run prisma:generate` - Génère le client Prisma TypeScript
- `npm run prisma:migrate` - Crée et applique une nouvelle migration
- `npm run prisma:studio` - Ouvre Prisma Studio (interface graphique)
- `npm run prisma:seed` - Remplit la base avec des données de test

## 🗂️ Structure du schéma

Le schéma Prisma contient **21 modèles** :

### Modèles principaux
1. **Territory** - Territoires géographiques avec hiérarchie
2. **User** - Utilisateurs (ADMIN, SUP, REP, MERCH, DIST)
3. **Account** - Comptes clients (optionnel)
4. **Outlet** - Points de vente
5. **RoutePlan** - Plans de tournée
6. **RouteStop** - Arrêts dans une tournée
7. **Visit** - Visites effectuées
8. **MerchCheck** - Contrôles merchandising
9. **MerchPhoto** - Photos merchandising
10. **SKU** - Produits (Stock Keeping Unit)
11. **Inventory** - Inventaire par outlet
12. **InventoryTx** - Transactions d'inventaire
13. **Order** - Commandes
14. **OrderLine** - Lignes de commande
15. **Payment** - Paiements
16. **Invoice** - Factures (optionnel)
17. **Promo** - Promotions
18. **PromoSKU** - Relation Promo-SKU
19. **PromoOutlet** - Relation Promo-Outlet
20. **AuditLog** - Logs d'audit
21. **SyncQueue** - File de synchronisation

### Énumérations
- `RoleEnum` - ADMIN, SUP, REP, MERCH, DIST
- `UserStatusEnum` - ACTIVE, INACTIVE
- `RouteStatusEnum` - PLANNED, IN_PROGRESS, DONE
- `RouteStopStatusEnum` - PLANNED, VISITED, SKIPPED
- `OrderStatusEnum` - DRAFT, CONFIRMED, DELIVERED, CANCELLED

## 🔧 Utilisation dans NestJS

Le `PrismaService` est disponible globalement dans toute l'application :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YourService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany();
  }

  async createOutlet(data: any) {
    return this.prisma.outlet.create({
      data,
      include: {
        territory: true,
        account: true,
      },
    });
  }
}
```

## 📖 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Prisma avec NestJS](https://docs.nestjs.com/recipes/prisma)
- [Prisma Studio](https://www.prisma.io/studio)

## 🔄 Workflow de développement

1. Modifiez le schéma dans `prisma/schema.prisma`
2. Créez une migration : `npm run prisma:migrate`
3. Le client Prisma est automatiquement régénéré
4. Utilisez les nouveaux types dans votre code TypeScript

## 🛠️ Commandes Prisma utiles

```bash
# Réinitialiser la base de données (⚠️ supprime toutes les données)
npx prisma migrate reset

# Voir l'état des migrations
npx prisma migrate status

# Formater le schéma
npx prisma format

# Valider le schéma
npx prisma validate
```
