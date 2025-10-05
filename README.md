# 🚀 SFA Backend - API NestJS

API Backend pour l'application SFA (Sales Force Automation) - CRM pour la gestion de la force de vente.

## 📋 Description

API REST construite avec NestJS, Prisma ORM et PostgreSQL avec PostGIS pour la géolocalisation.

**Frontend déployé sur Vercel** - Ce repository contient uniquement le backend.

## 🛠️ Technologies

- **NestJS** - Framework Node.js
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL 16** - Base de données avec PostGIS
- **JWT + Passport** - Authentification
- **bcrypt** - Hash des mots de passe
- **class-validator** - Validation des DTOs

## 📁 Structure du Projet

```
src/
├── auth/                    # Module d'authentification
│   ├── dto/                # DTOs (login, register)
│   ├── guards/             # Guards JWT
│   ├── strategies/         # Stratégies Passport
│   └── decorators/         # Décorateurs personnalisés
├── users/                  # Module utilisateurs
├── territories/            # Module territoires
├── outlets/                # Module points de vente
├── routes/                 # Module planification routes
├── visits/                 # Module visites
├── skus/                   # Module produits
├── orders/                 # Module commandes
├── payments/               # Module paiements
└── prisma/                 # Schéma et migrations
```

## 🚀 Installation Locale

### Prérequis

- Node.js 18+
- PostgreSQL 14+ avec PostGIS
- npm ou yarn

### Étape 1 : Installer les Dépendances

```bash
npm install
```

### Étape 2 : Configurer la Base de Données

**Créer la base PostgreSQL :**
```bash
# Ouvrez psql
psql -U postgres

# Créez la base de données
CREATE DATABASE sfa_db;

# Quittez
\q
```

**Configurer les variables d'environnement :**
```bash
# Copier le fichier d'environnement
cp .env.example .env
```

Éditez `.env` avec vos informations :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sfa_db?schema=public"
JWT_SECRET="votre-secret-jwt-super-securise"
JWT_EXPIRATION="24h"
NODE_ENV="development"
PORT="3000"
```

### Étape 3 : Initialiser Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer les migrations
npm run prisma:migrate
# Nommez votre migration (ex: "init")

# (Optionnel) Remplir avec des données de test
npm run prisma:seed
```

Cela créera un utilisateur admin par défaut :
- **Email** : `admin@sfa.com`
- **Password** : `admin123`

### Étape 4 : Démarrer le Serveur

```bash
npm run start:dev
```

Le backend sera disponible sur : **http://localhost:3000/api**

### Étape 5 : Vérifier l'Installation

**Tester l'API :**
```bash
# Health check
curl http://localhost:3000/api/auth/health

# Connexion avec l'admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sfa.com","password":"admin123"}'
```

**Prisma Studio (Interface graphique) :**
```bash
npm run prisma:studio
```
Ouvre une interface web sur `http://localhost:5555`

## 📝 Scripts Disponibles

```bash
# Développement
npm run start:dev          # Démarrer avec hot-reload

# Production
npm run build              # Build de production
npm run start:prod         # Démarrer en production

# Base de données
npx prisma studio          # Interface graphique Prisma
npx prisma migrate dev     # Créer une migration
npx prisma generate        # Générer le client Prisma
npx prisma migrate deploy  # Appliquer les migrations (production)

# Tests
npm run test               # Tests unitaires
npm run test:e2e           # Tests end-to-end
npm run test:cov           # Couverture de tests
```

## 🌐 Déploiement sur Render

Consultez le guide complet : [DEPLOIEMENT_RENDER.md](./DEPLOIEMENT_RENDER.md)

### Configuration Rapide

1. Créer une base PostgreSQL sur Render
2. Créer un Web Service avec ces paramètres :
   - **Build Command** : `npm install && npx prisma generate && npm run build`
   - **Start Command** : `npm run start:prod`
   - **Health Check Path** : `/api/auth/health`

3. Variables d'environnement requises :
   ```
   NODE_ENV=production
   DATABASE_URL=[Internal Database URL de Render]
   JWT_SECRET=[Clé secrète forte]
   JWT_EXPIRATION=24h
   PORT=10000
   FRONTEND_URL=https://votre-frontend.vercel.app
   ```

## 🔒 Sécurité

### Variables d'Environnement

**Ne jamais commiter le fichier `.env` !**

Fichier `.env.example` fourni comme template.

### Générer un JWT_SECRET Sécurisé

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 📊 Routes API Principales

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/login` | Connexion | Non |
| GET | `/api/auth/profile` | Profil utilisateur | Oui |
| GET | `/api/auth/health` | Health check | Non |
| GET | `/api/users` | Liste utilisateurs | Oui |
| GET | `/api/territories` | Liste territoires | Oui |
| GET | `/api/outlets` | Liste points de vente | Oui |
| POST | `/api/visits` | Créer une visite | Oui |
| GET | `/api/skus` | Catalogue produits | Oui |
| POST | `/api/orders` | Créer une commande | Oui |

## 🗄️ Base de Données

### Schéma Prisma

Le schéma inclut :
- Gestion hiérarchique des territoires
- Utilisateurs avec rôles (ADMIN, SUP, REP)
- Points de vente avec géolocalisation (PostGIS)
- Routes et planification
- Visites et merchandising
- Catalogue produits (SKU)
- Commandes et paiements
- Audit logs et synchronisation

### Migrations

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base (⚠️ DANGER - supprime toutes les données)
npx prisma migrate reset
```

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier PostgreSQL
pg_isready

# Vérifier la connexion
psql -U postgres -d sfa_db

# Régénérer le client Prisma
npx prisma generate
```

### Erreur de connexion à PostgreSQL
- Vérifiez que PostgreSQL est démarré
- Vérifiez les credentials dans `.env`
- Vérifiez que la base `sfa_db` existe

### Erreurs TypeScript sur Prisma
- Exécutez `npm run prisma:generate`
- Redémarrez votre IDE

### Erreur de migration

```bash
# Réinitialiser les migrations (⚠️ supprime les données)
npx prisma migrate reset

# Ou créer une nouvelle migration
npx prisma migrate dev --name fix_issue
```

### Tables non créées
- Exécutez `npm run prisma:migrate`
- Vérifiez les logs pour les erreurs de migration

### Erreur CORS

Vérifiez que `FRONTEND_URL` dans `.env` correspond à l'URL de votre frontend sur Vercel.

## 📚 Documentation

- [DEPLOIEMENT_RENDER.md](./DEPLOIEMENT_RENDER.md) - Guide de déploiement complet
- [CHECKLIST_DEPLOIEMENT.md](./CHECKLIST_DEPLOIEMENT.md) - Checklist avant déploiement
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)

## 📄 Licence

Ce projet est sous licence privée.

---

**Développé avec ❤️ pour optimiser la force de vente**
