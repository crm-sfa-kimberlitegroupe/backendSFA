# Système de Gestion des Secteurs et Routes

## Vue d'ensemble

Le système permet aux administrateurs de :
1. Créer des secteurs (zones géographiques)
2. Assigner des points de vente (PDV) à des secteurs
3. Assigner des secteurs à des vendeurs (REP)
4. Gérer les routes des vendeurs dans leurs secteurs

## Architecture de la base de données

### Modifications apportées au schéma Prisma

#### Table `user`
- **Nouveau champ** : `assignedSectorId` (UUID, nullable)
  - Référence le secteur assigné au vendeur
  - Relation avec `territory.id`

#### Table `outlet`
- **Nouveau champ** : `sectorId` (UUID, nullable)
  - Référence le secteur auquel le PDV est assigné
  - Relation avec `territory.id`

#### Table `territory`
- Utilisée pour représenter les secteurs
- Le champ `level` peut être : REGION | DISTRICT | ZONE | SECTEUR

## API Endpoints

### 1. Gestion des Secteurs

#### Créer un secteur
```http
POST /territories/sectors
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "SECT-001",
  "name": "Secteur Centre-Ville",
  "level": "SECTEUR",
  "parentId": "uuid-du-territoire-parent" // optionnel
}
```

#### Récupérer tous les secteurs
```http
GET /territories/sectors
Authorization: Bearer <admin_token>

Query params:
- level (optionnel) : filtrer par niveau
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "SECT-001",
      "name": "Secteur Centre-Ville",
      "level": "SECTEUR",
      "parent": { ... },
      "outletsSector": [ ... ], // PDV assignés
      "assignedUsers": [ ... ]  // Vendeurs assignés
    }
  ]
}
```

#### Récupérer un secteur par ID
```http
GET /territories/sectors/:id
Authorization: Bearer <admin_token>
```

#### Supprimer un secteur
```http
DELETE /territories/sectors/:id
Authorization: Bearer <admin_token>
```

### 2. Assignation des PDV aux Secteurs

#### Assigner des PDV à un secteur
```http
POST /territories/sectors/assign-outlets
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "sectorId": "uuid-du-secteur",
  "outletIds": [
    "uuid-pdv-1",
    "uuid-pdv-2",
    "uuid-pdv-3"
  ]
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "uuid-du-secteur",
    "name": "Secteur Centre-Ville",
    "outletsSector": [
      {
        "id": "uuid-pdv-1",
        "code": "PDV-001",
        "name": "Boutique Centre",
        "address": "123 Rue Principale",
        "lat": 5.123456,
        "lng": -4.123456
      }
    ]
  },
  "message": "PDV assignés au secteur avec succès"
}
```

### 3. Assignation des Secteurs aux Vendeurs

#### Assigner un secteur à un vendeur
```http
POST /territories/sectors/assign-vendor
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "vendorId": "uuid-du-vendeur",
  "sectorId": "uuid-du-secteur"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "uuid-du-vendeur",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "assignedSector": {
      "id": "uuid-du-secteur",
      "code": "SECT-001",
      "name": "Secteur Centre-Ville",
      "outletsSector": [ ... ]
    }
  },
  "message": "Secteur assigné au vendeur avec succès"
}
```

### 4. Consultation des PDV par Vendeur

#### Récupérer les PDV d'un vendeur
```http
GET /territories/vendors/:vendorId/outlets
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "uuid",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com"
    },
    "sector": {
      "id": "uuid",
      "code": "SECT-001",
      "name": "Secteur Centre-Ville"
    },
    "outlets": [
      {
        "id": "uuid",
        "code": "PDV-001",
        "name": "Boutique Centre",
        "address": "123 Rue Principale",
        "lat": 5.123456,
        "lng": -4.123456,
        "status": "APPROVED"
      }
    ]
  }
}
```

### 5. Routes du Vendeur

#### Récupérer les PDV disponibles pour créer une route (vendeur connecté)
```http
GET /routes/vendor-outlets
Authorization: Bearer <vendeur_token>
```

**Réponse** :
```json
{
  "user": {
    "id": "uuid",
    "firstName": "Jean",
    "lastName": "Dupont"
  },
  "sector": {
    "id": "uuid",
    "code": "SECT-001",
    "name": "Secteur Centre-Ville"
  },
  "outlets": [
    {
      "id": "uuid",
      "code": "PDV-001",
      "name": "Boutique Centre",
      "address": "123 Rue Principale",
      "lat": 5.123456,
      "lng": -4.123456,
      "status": "APPROVED"
    }
  ]
}
```

#### Créer une route pour le vendeur
```http
POST /routes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "uuid-du-vendeur",
  "date": "2025-10-23",
  "outletIds": [
    "uuid-pdv-1",
    "uuid-pdv-2",
    "uuid-pdv-3"
  ]
}
```

## Flux de travail typique

### Pour l'administrateur

1. **Créer un secteur**
   ```
   POST /territories/sectors
   ```

2. **Assigner des PDV au secteur**
   ```
   POST /territories/sectors/assign-outlets
   ```

3. **Assigner le secteur à un vendeur**
   ```
   POST /territories/sectors/assign-vendor
   ```

4. **Créer des routes pour le vendeur**
   ```
   POST /routes
   ```

### Pour le vendeur

1. **Consulter ses PDV assignés**
   ```
   GET /routes/vendor-outlets
   ```

2. **Voir ses routes du jour**
   ```
   GET /routes/my-routes?date=2025-10-23
   ```

3. **Démarrer une route**
   ```
   PATCH /routes/:id/start
   ```

## Migration de la base de données

Pour appliquer les modifications à la base de données :

```bash
# Option 1 : Utiliser Prisma migrate (recommandé en production)
npx prisma migrate deploy

# Option 2 : Appliquer manuellement le SQL
# Exécuter le fichier : prisma/migrations/add_sector_assignments/migration.sql
```

## Intégration Frontend

### Pour la page `/dashboard/pdv` (Admin)

**Fonctionnalités à implémenter :**

1. **Liste des secteurs**
   - Afficher tous les secteurs avec le nombre de PDV assignés
   - Bouton "Créer un secteur"

2. **Vue détaillée d'un secteur**
   - Liste des PDV assignés (avec carte)
   - Liste des vendeurs assignés
   - Bouton "Assigner des PDV"
   - Bouton "Retirer des PDV"

3. **Formulaire de création de secteur**
   - Code
   - Nom
   - Territoire parent (optionnel)

4. **Assignation de PDV**
   - Liste de tous les PDV approuvés
   - Checkbox pour sélection multiple
   - Bouton "Assigner au secteur"

### Pour la page `/dashboard/route` (Admin)

**Fonctionnalités à implémenter :**

1. **Sélection du vendeur**
   - Dropdown des vendeurs (REP)
   - Afficher le secteur assigné

2. **Affichage des PDV du secteur**
   - Carte avec marqueurs des PDV
   - Liste des PDV avec checkbox

3. **Création de route**
   - Sélection de la date
   - Sélection des PDV à visiter
   - Ordre de visite (drag & drop)
   - Bouton "Créer la route"

4. **Optimisation de route**
   - Algorithme pour optimiser l'ordre des visites
   - Affichage du trajet sur la carte

### Pour le vendeur (Vue mobile/desktop)

1. **Carte des PDV du secteur**
   - Afficher tous les PDV du secteur assigné
   - Filtres par statut, canal, segment

2. **Mes routes**
   - Routes planifiées
   - Route du jour avec navigation
   - Historique des routes

## Exemples de code Frontend (React/Vue)

### Récupérer les secteurs
```typescript
const getSectors = async () => {
  const response = await fetch('/api/territories/sectors', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data;
};
```

### Assigner des PDV à un secteur
```typescript
const assignOutlets = async (sectorId: string, outletIds: string[]) => {
  const response = await fetch('/api/territories/sectors/assign-outlets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sectorId, outletIds })
  });
  return response.json();
};
```

### Assigner un secteur à un vendeur
```typescript
const assignSectorToVendor = async (vendorId: string, sectorId: string) => {
  const response = await fetch('/api/territories/sectors/assign-vendor', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ vendorId, sectorId })
  });
  return response.json();
};
```

## Prochaines étapes recommandées

1. **Optimisation de routes**
   - Implémenter un algorithme de routage (TSP, Google Maps API)
   - Calculer les distances entre PDV
   - Optimiser l'ordre des visites

2. **Gestion avancée des secteurs**
   - Dessiner des zones géographiques sur une carte
   - Auto-assignation des PDV basée sur les coordonnées
   - Équilibrage de charge entre vendeurs

3. **Analytics**
   - Taux de couverture par secteur
   - Performance par vendeur
   - Statistiques de visites

4. **Notifications**
   - Notifier les vendeurs des nouvelles routes
   - Alertes pour PDV non visités
   - Rappels de visites planifiées
