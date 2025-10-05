# 📊 Prisma - Documentation Complète

Guide complet pour utiliser Prisma dans le projet SFA Backend.

## 📋 Vue d'Ensemble

Prisma est l'ORM utilisé pour gérer la base de données PostgreSQL. Le schéma contient **21 modèles** couvrant tous les aspects du CRM.

## ⚙️ Configuration

### Variables d'Environnement

Fichier `.env` :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sfa_db?schema=public"
```

### Fichiers Prisma

```
prisma/
├── schema.prisma      # Schéma de la base de données (21 modèles)
├── seed.ts            # Données de test
└── migrations/        # Historique des migrations
```

## 🗂️ Schéma de Base de Données

### Modèles Implémentés (21 au total)

#### 1. Gestion des Territoires et Utilisateurs
- **Territory** - Territoires avec hiérarchie (parent_id)
- **User** - Utilisateurs avec rôles et statuts
- **Account** - Comptes clients (optionnel)

#### 2. Points de Vente
- **Outlet** - Points de vente avec géolocalisation (PostGIS)

#### 3. Planification et Routes
- **RoutePlan** - Plans de tournée
- **RouteStop** - Arrêts de tournée

#### 4. Visites et Merchandising
- **Visit** - Visites avec check-in/out
- **MerchCheck** - Contrôles merchandising
- **MerchPhoto** - Photos merchandising

#### 5. Catalogue Produits
- **SKU** - Produits (Stock Keeping Unit)
- **Inventory** - Inventaire par outlet
- **InventoryTx** - Transactions d'inventaire

#### 6. Commandes et Paiements
- **Order** - Commandes
- **OrderLine** - Lignes de commande
- **Payment** - Paiements
- **Invoice** - Factures (optionnel)

#### 7. Promotions
- **Promo** - Promotions
- **PromoSKU** - Table de liaison Promo-SKU
- **PromoOutlet** - Table de liaison Promo-Outlet

#### 8. Système
- **AuditLog** - Logs d'audit
- **SyncQueue** - File de synchronisation

### Énumérations

```prisma
enum RoleEnum {
  ADMIN    // Administrateur
  SUP      // Superviseur
  REP      // Représentant
  MERCH    // Merchandiser
  DIST     // Distributeur
}

enum UserStatusEnum {
  ACTIVE
  INACTIVE
}

enum RouteStatusEnum {
  PLANNED
  IN_PROGRESS
  DONE
}

enum RouteStopStatusEnum {
  PLANNED
  VISITED
  SKIPPED
}

enum OrderStatusEnum {
  DRAFT
  CONFIRMED
  DELIVERED
  CANCELLED
}
```

## 🛠️ Commandes Prisma

### Commandes de Base

```bash
# Générer le client Prisma TypeScript
npm run prisma:generate

# Créer une nouvelle migration
npm run prisma:migrate
# Ou : npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Remplir la base avec des données de test
npm run prisma:seed
```

### Commandes Avancées

```bash
# Voir l'état des migrations
npx prisma migrate status

# Réinitialiser la base de données (⚠️ supprime toutes les données)
npx prisma migrate reset

# Synchroniser le schéma sans migration (dev uniquement)
npx prisma db push

# Formater le schéma
npx prisma format

# Valider le schéma
npx prisma validate
```

## 💻 Utilisation dans le Code

### Injection du PrismaService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutletsService {
  constructor(private prisma: PrismaService) {}

  // Vos méthodes ici
}
```

### Exemples de Requêtes

#### Créer un Outlet

```typescript
async createOutlet(data: CreateOutletDto) {
  return this.prisma.outlet.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      territoryId: data.territoryId,
    },
  });
}
```

#### Trouver avec Relations

```typescript
async findOutletWithVisits(outletId: string) {
  return this.prisma.outlet.findUnique({
    where: { id: outletId },
    include: {
      territory: true,
      visits: {
        include: {
          user: true,
        },
        orderBy: {
          checkInTime: 'desc',
        },
      },
    },
  });
}
```

#### Requête Complexe avec Filtres

```typescript
async findOutletsByTerritory(territoryId: string, filters: FilterDto) {
  return this.prisma.outlet.findMany({
    where: {
      territoryId,
      isActive: true,
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      territory: true,
    },
    orderBy: {
      name: 'asc',
    },
    skip: filters.skip,
    take: filters.take,
  });
}
```

#### Transaction

```typescript
async createOrderWithLines(orderData: CreateOrderDto) {
  return this.prisma.$transaction(async (prisma) => {
    // Créer la commande
    const order = await prisma.order.create({
      data: {
        outletId: orderData.outletId,
        userId: orderData.userId,
        totalAmount: orderData.totalAmount,
      },
    });

    // Créer les lignes de commande
    await prisma.orderLine.createMany({
      data: orderData.lines.map(line => ({
        orderId: order.id,
        skuId: line.skuId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });

    return order;
  });
}
```

## 🎨 Caractéristiques Avancées

### Types de Données Spéciaux

- `@db.Uuid` - Identifiants UUID
- `@db.Text` - Texte long
- `@db.Decimal(10, 2)` - Prix et montants
- `@db.Decimal(10, 8)` - Coordonnées GPS
- `Json` - Données JSON (metadata, geom)

### Relations

- **One-to-Many** : `User` → `Visit[]`
- **Many-to-One** : `Visit` → `User`
- **Many-to-Many** : `Promo` ↔ `SKU` (via `PromoSKU`)
- **Self-Relation** : `Territory` → `parent` / `children[]`

### Règles de Suppression

- `CASCADE` - Supprime les enregistrements liés
- `SET NULL` - Met à NULL les références
- `RESTRICT` - Empêche la suppression si des références existent

### Index

```prisma
@@index([territoryId])           // Index simple
@@index([userId, checkInTime])   // Index composite
@@unique([outletId, skuId])      // Contrainte unique
```

## 🔄 Workflow de Développement

### 1. Modifier le Schéma

Éditez `prisma/schema.prisma` :

```prisma
model NewModel {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  createdAt DateTime @default(now()) @db.Timestamptz(6)
}
```

### 2. Créer une Migration

```bash
npm run prisma:migrate
# Nommez la migration : "add_new_model"
```

### 3. Le Client est Régénéré Automatiquement

Le client Prisma TypeScript est mis à jour avec les nouveaux types.

### 4. Utiliser dans le Code

```typescript
async createNew(data: CreateNewDto) {
  return this.prisma.newModel.create({ data });
}
```

## 🔒 Bonnes Pratiques

### Sécurité

- ✅ Toujours valider les données avant de les passer à Prisma
- ✅ Utiliser des DTOs avec `class-validator`
- ✅ Ne jamais exposer les mots de passe (utilisez `select` ou `omit`)
- ✅ Utiliser des transactions pour les opérations multiples

### Performance

- ✅ Créer des index sur les champs fréquemment recherchés
- ✅ Utiliser `select` pour ne récupérer que les champs nécessaires
- ✅ Paginer les résultats avec `skip` et `take`
- ✅ Utiliser `include` avec parcimonie (éviter le N+1)

### Migrations

- ✅ Toujours tester les migrations en local avant la production
- ✅ Utiliser `migrate deploy` en production (jamais `migrate dev`)
- ✅ Faire des backups avant les migrations importantes
- ✅ Nommer les migrations de manière descriptive

## 🧪 Seed de Données

Le fichier `prisma/seed.ts` crée des données de test :

```typescript
// Territoire par défaut
const defaultTerritory = await prisma.territory.create({
  data: {
    name: 'Territoire National',
    code: 'NAT',
  },
});

// Utilisateur admin
const adminUser = await prisma.user.create({
  data: {
    email: 'admin@sfa.com',
    passwordHash: await bcrypt.hash('admin123', 10),
    firstName: 'Admin',
    lastName: 'SFA',
    role: 'ADMIN',
    status: 'ACTIVE',
    territoryId: defaultTerritory.id,
  },
});
```

Exécuter le seed :
```bash
npm run prisma:seed
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Prisma avec NestJS](https://docs.nestjs.com/recipes/prisma)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## 🆘 Support

Pour toute question sur Prisma :
- Consultez la [documentation officielle](https://www.prisma.io/docs)
- Vérifiez les [exemples Prisma](https://github.com/prisma/prisma-examples)
- Rejoignez la [communauté Prisma](https://www.prisma.io/community)

---

**Prisma est maintenant configuré et prêt à l'emploi ! 🚀**
