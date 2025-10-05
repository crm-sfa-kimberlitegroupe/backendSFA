# Checklist de Déploiement Backend sur Render

Utilisez cette checklist pour vous assurer que tout est prêt avant le déploiement du backend.

**Note :** Frontend déployé séparément sur Vercel.

## Avant de Déployer

### 1. Code Source

- [ ] Tout le code est commité sur Git
- [ ] Aucun fichier `.env` n'est commité (vérifier `.gitignore`)
- [ ] Le code fonctionne en local sans erreur
- [ ] Les tests passent (si applicable)
- [ ] Code poussé sur GitHub

### 2. Configuration Backend

#### Fichiers Requis

- [ ] `package.json` existe et est complet
- [ ] `prisma/schema.prisma` existe
- [ ] `.env.example` existe et est à jour
- [ ] `.dockerignore` existe (optionnel)
- [ ] `.gitignore` contient `.env`

#### Scripts package.json

Vérifiez que ces scripts existent :

- [ ] `"start:prod": "node dist/main"`
- [ ] `"build": "nest build"`
- [ ] `"prisma:generate": "prisma generate"`
- [ ] `"prisma:migrate:deploy": "prisma migrate deploy"`
- [ ] `"postinstall": "prisma generate"`

**Exemple :**
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main",
    "prisma:generate": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "postinstall": "prisma generate"
  }
}
```

#### Variables d'Environnement à Préparer

Préparez ces valeurs avant de créer le service sur Render :

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (sera fourni par Render après création de la BDD)
- [ ] `JWT_SECRET` (générer une clé forte - voir section Sécurité)
- [ ] `JWT_EXPIRATION=24h`
- [ ] `PORT=10000`
- [ ] `FRONTEND_URL` (URL de votre frontend sur Vercel)

### 3. Base de Données

#### Migrations Prisma

- [ ] Toutes les migrations sont créées et testées en local
- [ ] Les migrations sont dans `prisma/migrations/`
- [ ] Le schéma Prisma est à jour
- [ ] Aucune migration en attente (`npx prisma migrate status`)

#### Extensions PostgreSQL

- [ ] PostGIS est requis (si vous utilisez la géolocalisation)
- [ ] Version PostgreSQL compatible (16 recommandé)

### 4. Tests Locaux

#### Backend

```bash
# Build de production
npm run build

# Démarrer en mode production
npm run start:prod
```

- [ ] Le build réussit sans erreur
- [ ] Le serveur démarre correctement
- [ ] Les routes API répondent
- [ ] La connexion à la BDD fonctionne

##  Étapes de Déploiement

### Phase 1 : Préparation GitHub

```bash
# 1. Vérifier le statut Git
git status

# 2. Ajouter tous les fichiers
git add .

# 3. Créer un commit
git commit -m "Configuration pour déploiement Render"

# 4. Pousser vers GitHub
git push origin main
```

- [ ] Code poussé sur GitHub
- [ ] Repository accessible (public ou privé avec accès Render)
- [ ] Branche `main` à jour

### Phase 2 : Configuration Render

#### Créer un Compte Render

- [ ] Compte créé sur https://render.com
- [ ] Email vérifié
- [ ] Méthode de paiement ajoutée (même pour plan gratuit)

#### Connecter GitHub

- [ ] Render connecté à votre compte GitHub
- [ ] Permissions accordées pour accéder au repository

### Phase 3 : Créer la Base de Données

- [ ] PostgreSQL créé sur Render
- [ ] Nom : `sfa-database`
- [ ] Version : PostgreSQL 16
- [ ] Région : Frankfurt (ou proche)
- [ ] Plan : Free (90 jours gratuit)
- [ ] **Internal Database URL** copié

#### Activer PostGIS (si nécessaire)

- [ ] Connexion via Shell
- [ ] Exécution de `CREATE EXTENSION IF NOT EXISTS postgis;`

### Phase 4 : Créer le Web Service

- [ ] Web Service créé
- [ ] Repository GitHub connecté
- [ ] Configuration :
  - [ ] Name : `sfa-backend`
  - [ ] Region : Frankfurt (même que la BDD)
  - [ ] Root Directory : `backendSFA/backend-sfa`
  - [ ] Runtime : Node
  - [ ] Build Command : `npm install && npx prisma generate && npm run build`
  - [ ] Start Command : `npm run start:prod`
  - [ ] Health Check Path : `/api/auth/health`
  - [ ] Plan : Free

#### Variables d'Environnement Configurées

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=[Internal Database URL]`
- [ ] `JWT_SECRET=[Clé secrète forte]`
- [ ] `JWT_EXPIRATION=24h`
- [ ] `PORT=10000`
- [ ] `FRONTEND_URL=https://votre-frontend.vercel.app`

### Phase 5 : Vérification du Déploiement

#### Logs de Build

- [ ] Build réussi (vérifier les logs)
- [ ] Dépendances installées
- [ ] Prisma client généré
- [ ] Migrations exécutées
- [ ] Serveur démarré

#### Tests API

```bash
# Test du health check
curl https://sfa-backend.onrender.com/api/auth/health
```

- [ ] Health check répond : `{"status":"ok"}`
- [ ] Pas d'erreurs 5xx
- [ ] Temps de réponse acceptable

#### Test d'Authentification

```bash
# Test d'inscription
curl -X POST https://sfa-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

- [ ] Inscription fonctionne
- [ ] Login fonctionne
- [ ] JWT token retourné
- [ ] Données persistées en base

### Phase 6 : Intégration avec Vercel

- [ ] `FRONTEND_URL` configuré avec l'URL Vercel exacte
- [ ] CORS configuré correctement dans `src/main.ts`
- [ ] Frontend peut communiquer avec le backend
- [ ] Pas d'erreurs CORS dans la console navigateur

##  Dépannage Rapide

### Backend ne démarre pas

**Vérifier :**
- [ ] Logs dans Render Dashboard → sfa-backend → Logs
- [ ] `DATABASE_URL` est l'Internal URL
- [ ] Migrations Prisma ont réussi
- [ ] Port est 10000
- [ ] Toutes les dépendances sont installées

**Actions :**
```bash
# Via Shell dans Render
npx prisma migrate deploy
npx prisma generate
```

### Erreur CORS

**Vérifier :**
- [ ] `FRONTEND_URL` correspond exactement à l'URL Vercel
- [ ] Pas de `/` à la fin de `FRONTEND_URL`
- [ ] CORS activé dans `src/main.ts`

**Solution :**
```typescript
// src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Erreurs de Base de Données

**Vérifier :**
- [ ] `DATABASE_URL` utilise l'Internal URL
- [ ] Backend et BDD dans la même région
- [ ] Base de données démarrée
- [ ] PostGIS activé (si nécessaire)

### Service se met en veille

**Plan gratuit :**
- Se met en veille après 15 min d'inactivité
- Redémarre en ~30 secondes à la première requête

**Solutions :**
- Accepter le délai (gratuit)
- Utiliser un service de ping (UptimeRobot)
- Passer au plan payant ($7/mois)

## Sécurité

### Variables Sensibles

- [ ] `JWT_SECRET` est fort et unique
- [ ] Minimum 32 caractères
- [ ] Pas de secrets dans le code
- [ ] `.env` dans `.gitignore`
- [ ] Variables configurées sur Render (pas dans le code)

### Générer un JWT_SECRET Sécurisé

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Exemple de résultat :**
```
Kx8vN2pQ7mR4tY9wZ3aB6cD1eF5gH8iJ0kL3mN6oP9qR2sT5uV8wX1yZ4aB7cD0e=
```

- [ ] `JWT_SECRET` généré
- [ ] Copié dans Render Environment
- [ ] Jamais commité dans Git

### HTTPS

- [ ] HTTPS automatiquement activé par Render
- [ ] Certificat SSL valide
- [ ] Pas d'avertissements de sécurité

##  Monitoring

### Après le Déploiement

- [ ] Configurer les alertes Render
- [ ] Surveiller l'utilisation des ressources
- [ ] Vérifier les logs régulièrement
- [ ] Tester toutes les fonctionnalités principales

### Métriques à Surveiller

- [ ] Temps de réponse API
- [ ] Utilisation mémoire backend
- [ ] Utilisation CPU
- [ ] Taille de la base de données
- [ ] Nombre de connexions BDD
- [ ] Erreurs 5xx

### Outils de Monitoring (optionnel)

- [ ] Sentry pour le tracking d'erreurs
- [ ] DataDog pour les métriques
- [ ] UptimeRobot pour la disponibilité

## Coûts

### Plan Gratuit Render

**Base de Données PostgreSQL :**
- 90 jours gratuits
- Puis $7/mois
- [ ] Calendrier de renouvellement noté

**Backend (Web Service) :**
- 750 heures/mois gratuites
- Se met en veille après 15 min
- [ ] Acceptable pour votre usage

**Total estimé après 90 jours :** $7/mois (BDD uniquement)

## Documentation

- [ ] README.md à jour
- [ ] DEPLOIEMENT_RENDER.md lu et compris
- [ ] Variables d'environnement documentées
- [ ] Procédure de rollback définie
- [ ] Contacts d'urgence notés

## Prochaines Étapes

Après un déploiement réussi :

- [ ] Configurer un nom de domaine personnalisé
- [ ] Mettre en place des backups automatiques de la BDD
- [ ] Configurer CI/CD avec GitHub Actions
- [ ] Optimiser les performances (caching, indexation)
- [ ] Mettre en place un monitoring avancé
- [ ] Documenter les procédures d'urgence
- [ ] Former l'équipe sur les procédures de déploiement

## Félicitations !

Si tous les points sont cochés, votre backend est prêt pour la production ! 

---

**Date de déploiement :** _______________

**Déployé par :** _______________

**URL Backend :** https://sfa-backend.onrender.com

**URL Frontend (Vercel) :** https://_______________

**Région Render :** _______________

**Notes :**
_______________________________________________
_______________________________________________
_______________________________________________
