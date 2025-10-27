# 🏗️ Architecture du Système SFA (Sales Force Automation)

## 📊 Vue d'ensemble

Ce système SFA gère la force de vente avec une hiérarchie à 3 niveaux :
- **SUP (Superviseur)** → Manager global
- **ADMIN (Administrateur)** → Gère un territoire/zone
- **REP (Représentant)** → Vendeur terrain assigné à un secteur

---

## 🗺️ Modèle de Données - Relations Clés

### 1. Hiérarchie Territoriale
```
ZONE (créée par SUP, assignée à ADMIN)
  └─ SECTEUR (créé par ADMIN)
      └─ SOUS-SECTEUR (optionnel)
```

**Relation Prisma :**
```prisma
Territory.parent → Territory (auto-référence)
Territory.children → Territory[]
```

### 2. Hiérarchie Managériale
```
SUP (Manager global)
  └─ ADMIN (Gère zone)
      └─ REP (Vendeur terrain)
```

**Relation Prisma :**
```prisma
User.manager → User (auto-référence)
User.subordinates → User[]
```

### 3. Assignation Territoriale

#### Pour ADMIN :
- `Territory.adminId` → L'ADMIN responsable de la ZONE
- Un ADMIN gère **UN SEUL** territoire à la fois

#### Pour REP :
- `User.territoryId` → Territoire "maison" (peu utilisé)
- `User.assignedSectorId` → Secteur de travail quotidien (IMPORTANT)
- Un REP travaille dans **UN SEUL** secteur

#### Pour Outlets (PDV) :
- `Outlet.territoryId` → Zone large d'appartenance
- `Outlet.sectorId` → Secteur précis pour les routes

---

## 🔄 Flux Métier Principaux

### Flux 1 : Création de Territoire
```
1. SUP crée une ZONE
   ├─ Définit les régions/quartiers
   ├─ Estime le potentiel commercial
   └─ Peut assigner un ADMIN immédiatement (optionnel)

2. SUP assigne un ADMIN à la ZONE
   └─ Transaction atomique qui met à jour :
       ├─ Territory.adminId
       └─ (Si changement) User.managerId de tous les REP

3. ADMIN crée des SECTEURS dans sa ZONE
   └─ Divise la zone en secteurs opérationnels
```

### Flux 2 : Assignation de Vendeur
```
1. ADMIN crée/importe des PDV dans son territoire

2. ADMIN crée des SECTEURS
   └─ Regroupe des PDV par proximité géographique

3. ADMIN assigne un REP à un SECTEUR
   ├─ User.assignedSectorId = secteur
   └─ User.managerId = ADMIN
```

### Flux 3 : Visite Terrain (REP)
```
1. REP planifie sa route (RoutePlan)
   └─ Sélectionne les PDV à visiter dans son secteur

2. REP visite un PDV
   ├─ Check-in (Visit.checkinAt avec GPS)
   ├─ Merchandising (MerchCheck)
   ├─ Prise de commande (Order)
   └─ Check-out (Visit.checkoutAt)

3. Données synchronisées vers le serveur
```

---

## 🎯 Règles Métier Critiques

### ✅ VALIDATIONS À IMPLÉMENTER

#### Au niveau ADMIN :
- ✅ Un ADMIN ne peut gérer qu'UN SEUL territoire à la fois
- ✅ Quand un ADMIN change de territoire, ses REP doivent être réassignés
- ⚠️ Un ADMIN ne peut créer des secteurs que dans SON territoire

#### Au niveau REP :
- ✅ Un REP ne peut être assigné qu'à UN SEUL secteur
- ⚠️ Un REP ne peut visiter que des PDV dans SON secteur
- ⚠️ Un REP ne peut voir que les données de SON secteur

#### Au niveau Territory :
- ✅ Une ZONE peut avoir plusieurs SECTEURS enfants
- ✅ Un SECTEUR doit avoir un parent (ZONE)
- ⚠️ Suppression cascade : si ZONE supprimée → SECTEURS archivés

---

## 🔐 Matrice des Permissions

| Ressource | SUP | ADMIN | REP |
|-----------|-----|-------|-----|
| **Territoires (ZONE)** |
| Créer ZONE | ✅ | ❌ | ❌ |
| Lire toutes ZONES | ✅ | ❌ | ❌ |
| Lire SA zone | - | ✅ | ❌ |
| Assigner ADMIN | ✅ | ❌ | ❌ |
| **Secteurs** |
| Créer SECTEUR | ❌ | ✅ (dans sa zone) | ❌ |
| Lire SECTEURS | ✅ | ✅ (sa zone) | ✅ (son secteur) |
| Modifier SECTEUR | ❌ | ✅ (sa zone) | ❌ |
| **Utilisateurs** |
| Créer REP | ✅ | ✅ | ❌ |
| Assigner REP à secteur | ❌ | ✅ (sa zone) | ❌ |
| Voir toute l'équipe | ✅ | ✅ (ses REP) | ❌ |
| **PDV (Outlets)** |
| Créer/Importer PDV | ✅ | ✅ (sa zone) | ❌ |
| Proposer PDV | - | - | ✅ |
| Valider PDV | ✅ | ✅ | ❌ |
| Visiter PDV | - | - | ✅ (son secteur) |

---

## 📁 Structure des Modules

```
src/
├── auth/                    # Authentification JWT, guards
├── users/                   # Gestion utilisateurs (SUP, ADMIN, REP)
├── territories/             # Gestion territoires et secteurs
│   ├── dto/
│   │   ├── create-territory.dto.ts
│   │   ├── assign-admin.dto.ts
│   │   └── create-sector.dto.ts
│   ├── territories.controller.ts
│   └── territories.service.ts
├── outlets/                 # Gestion PDV
├── routes/                  # Planification de routes
├── visits/                  # Visites terrain
├── orders/                  # Commandes
└── tasks/                   # Tâches assignées
```

---

## 🎨 Patterns de Code Utilisés

### 1. Repository Pattern (via Prisma)
```typescript
// ❌ Éviter : logique métier dans le controller
@Post()
async create(@Body() data) {
  return this.prisma.territory.create({ data });
}

// ✅ Correct : logique dans le service
@Post()
async create(@Body() dto: CreateTerritoryDto) {
  return this.territoriesService.create(dto);
}
```

### 2. DTO (Data Transfer Objects)
```typescript
// Validation avec class-validator
export class AssignAdminDto {
  @IsUUID()
  @IsNotEmpty()
  adminId: string;
}
```

### 3. Guards & Decorators
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUP)
@Post('territories')
async createTerritory() { }
```

### 4. Transactions Prisma
```typescript
// Pour opérations atomiques critiques
await this.prisma.$transaction([
  this.prisma.territory.update({ ... }),
  this.prisma.user.updateMany({ ... }),
  this.prisma.auditLog.create({ ... }),
]);
```

---

## 🚀 Évolutions Futures

### Court terme (Sprint actuel)
- [ ] Ajouter validation : ADMIN ne peut créer secteur que dans SA zone
- [ ] Ajouter validation : REP ne peut visiter que PDV de SON secteur
- [ ] Implémenter soft-delete pour territoires

### Moyen terme (1-2 mois)
- [ ] Historique des changements d'assignation (TerritoryAdminHistory)
- [ ] Notifications push pour assignations
- [ ] Dashboard analytics par territoire
- [ ] Export Excel des données terrain

### Long terme (3-6 mois)
- [ ] Machine Learning : prédiction du potentiel commercial
- [ ] Optimisation automatique des routes
- [ ] Recommandations de réassignation de secteurs
- [ ] Module de gamification pour REP

---

## 📚 Ressources & Documentation

### APIs Externes
- **Google Maps API** : Geocoding, directions, boundaries
- **Cloudinary** : Stockage photos merchandising
- **Nominatim (OSM)** : Données géographiques open source

### Packages Clés
- `@nestjs/common`, `@nestjs/core` : Framework
- `@prisma/client` : ORM
- `class-validator` : Validation DTOs
- `bcrypt` : Hashing mots de passe
- `@nestjs/jwt` : Authentification

### Base de Données
- **PostgreSQL 14+**
- **Extensions** : `uuid-ossp`, `postgis` (géolocalisation)

---

## 🔍 Comment Naviguer le Code

### Pour ajouter une nouvelle feature :
1. Créer le DTO dans `src/[module]/dto/`
2. Ajouter la méthode dans le service
3. Créer l'endpoint dans le controller
4. Ajouter les guards/roles appropriés
5. Tester avec Postman
6. Documenter dans ce fichier

### Pour debugger :
1. Vérifier les logs `console.log()` dans les services
2. Utiliser Prisma Studio : `npx prisma studio`
3. Vérifier les migrations : `npx prisma migrate status`

---

**Dernière mise à jour** : 27 octobre 2025
**Auteur** : Équipe SFA
**Version** : 1.2.0
