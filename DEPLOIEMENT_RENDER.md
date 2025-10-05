# Guide de Déploiement Backend sur Render

Guide complet pour déployer l'API SFA Backend sur Render.

**Note :** Le frontend est déployé séparément sur Vercel.

## Prérequis

1. Compte GitHub avec le code backend
2. Compte Render (gratuit) : https://render.com
3. Code backend poussé sur GitHub

## Étape 1 : Créer la Base de Données PostgreSQL

### Sur Render Dashboard

1. **New +** → **PostgreSQL**
2. Configuration :
   - **Name** : `sfa-database`
   - **Database** : `sfa_db`
   - **User** : `sfa_user`
   - **Region** : `Frankfurt` (ou proche de vous)
   - **PostgreSQL Version** : `16`
   - **Plan** : **Free** (90 jours gratuit, puis $7/mois)

3. **Create Database**

4. **Important** : Une fois créée, copiez l'**Internal Database URL**
   - Format : `postgresql://user:password@internal-host/database`
   - **Utilisez toujours l'Internal URL** (pas l'External)

### Activer PostGIS (si nécessaire)

Si votre schéma Prisma utilise PostGIS pour la géolocalisation :

1. Allez dans votre database → **Shell**
2. Exécutez :
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

## Étape 2 : Déployer le Backend (Web Service)

### Sur Render Dashboard

1. **New +** → **Web Service**
2. **Connect Repository** : Sélectionnez votre repository GitHub
3. Configuration :

   **Basic Settings:**
   - **Name** : `sfa-backend`
   - **Region** : `Frankfurt` (même région que la BDD)
   - **Branch** : `main`
   - **Root Directory** : `backendSFA/backend-sfa`
   - **Runtime** : `Node`

   **Build & Deploy:**
   - **Build Command** :
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command** :
     ```bash
     npm run start:prod
     ```

   **Plan:**
   - **Instance Type** : `Free` (750h/mois gratuit)

4. **Advanced Settings** :
   - **Health Check Path** : `/api/auth/health`
   - **Auto-Deploy** : `Yes` (redéploiement automatique sur git push)

### Variables d'Environnement

Cliquez sur **Environment** et ajoutez :

```env
NODE_ENV=production
DATABASE_URL=[Collez l'Internal Database URL de votre BDD]
JWT_SECRET=[Générez une clé secrète forte - voir ci-dessous]
JWT_EXPIRATION=24h
PORT=10000
FRONTEND_URL=https://votre-frontend.vercel.app
```

#### Générer un JWT_SECRET Sécurisé

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

5. **Create Web Service**

## Étape 3 : Vérifier le Déploiement

### Suivre les Logs

1. Dans votre service **sfa-backend** → **Logs**
2. Vérifiez que :
   - Les dépendances s'installent
   - Prisma génère le client
   - Le build réussit
   - Les migrations s'exécutent (via `postinstall`)
   - Le serveur démarre sur le port 10000

### Tester l'API

Une fois déployé, testez le health check :

```bash
curl https://sfa-backend.onrender.com/api/auth/health
```

**Réponse attendue :**
```json
{"status":"ok"}
```

### Tester l'Authentification

```bash
# Test d'inscription
curl -X POST https://sfa-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Configuration Post-Déploiement

### Migrations Prisma

Les migrations s'exécutent automatiquement grâce au script `postinstall` dans `package.json` :

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Si vous devez exécuter manuellement les migrations :

1. **sfa-backend** → **Shell** (en haut à droite)
2. Exécutez :
   ```bash
   npx prisma migrate deploy
   ```

### Configurer CORS pour Vercel

Assurez-vous que `FRONTEND_URL` dans les variables d'environnement correspond exactement à votre URL Vercel :

```env
FRONTEND_URL=https://votre-app.vercel.app
```

Dans `src/main.ts`, le CORS est configuré pour accepter cette origine :

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

## Mises à Jour et Redéploiement

### Déploiement Automatique

Render redéploie automatiquement à chaque push sur la branche `main` :

```bash
git add .
git commit -m "Update backend"
git push origin main
```

### Déploiement Manuel

Si vous désactivez l'auto-deploy :

1. **sfa-backend** → **Manual Deploy**
2. Sélectionnez la branche ou le commit
3. **Deploy**

### Rollback

En cas de problème :

1. **sfa-backend** → **Events**
2. Trouvez un déploiement précédent qui fonctionnait
3. Cliquez sur **Rollback**

## Dépannage

### Le backend ne démarre pas

**Vérifier les logs :**
1. **sfa-backend** → **Logs**
2. Cherchez les erreurs

**Problèmes courants :**

- **DATABASE_URL incorrect** : Vérifiez que vous utilisez l'Internal URL
- **Migrations échouées** : Exécutez manuellement `npx prisma migrate deploy` via Shell
- **Port incorrect** : Render utilise automatiquement `PORT=10000`
- **Dépendances manquantes** : Vérifiez `package.json`

### Erreur CORS depuis Vercel

**Symptôme :** Le frontend ne peut pas communiquer avec le backend

**Solution :**
1. Vérifiez `FRONTEND_URL` dans les variables d'environnement
2. Assurez-vous qu'il n'y a pas de `/` à la fin de l'URL
3. Redéployez le backend après modification

### Base de données : erreur de connexion

**Vérifications :**
1. Utilisez l'**Internal Database URL** (pas l'External)
2. Backend et BDD dans la **même région**
3. La base de données est **démarrée** (vérifier dans Render Dashboard)

### Le service se met en veille

**Plan gratuit :** Le service se met en veille après 15 minutes d'inactivité.

**Solutions :**
- Accepter le délai de 30s au premier accès
- Utiliser un service de ping (ex: UptimeRobot) - gratuit
- Passer au plan payant ($7/mois) pour éviter la mise en veille

## Coûts Render

### Plan Gratuit

**Base de Données PostgreSQL :**
- 90 jours gratuits
- 1 GB de stockage
- Puis $7/mois

**Web Service (Backend) :**
- 750 heures/mois gratuites
- 512 MB RAM
-  Se met en veille après 15 min d'inactivité

### Optimisation des Coûts

- Utilisez le plan gratuit pour le développement/test
- Passez au plan payant pour la production
- Surveillez l'utilisation dans le Dashboard

## Monitoring

### Métriques à Surveiller

1. **sfa-backend** → **Metrics**
   - CPU Usage
   - Memory Usage
   - Request Count
   - Response Time

2. **sfa-database** → **Metrics**
   - Connections
   - Storage Used
   - Query Performance

### Alertes

Configurez des alertes pour :
- Service down
- Erreurs 5xx
- Utilisation mémoire élevée
- Espace disque BDD

## Sécurité

### Checklist de Sécurité

- [ ] `JWT_SECRET` fort et unique (min 32 caractères)
- [ ] `.env` dans `.gitignore` (ne jamais commiter)
- [ ] `DATABASE_URL` utilise l'Internal URL
- [ ] CORS configuré uniquement pour Vercel
- [ ] Variables sensibles dans Render Environment (pas dans le code)
- [ ] HTTPS activé (automatique sur Render)

### Rotation des Secrets

Pour changer le `JWT_SECRET` :

1. Générez un nouveau secret
2. Mettez à jour dans Render Environment
3. Redéployez le backend
4.  Tous les utilisateurs devront se reconnecter

##  Ressources

- [Documentation Render](https://render.com/docs)
- [Render Community](https://community.render.com)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## Prochaines Étapes

Après un déploiement réussi :

- [ ] Configurer un nom de domaine personnalisé
- [ ] Mettre en place des backups automatiques de la BDD
- [ ] Configurer CI/CD avec GitHub Actions
- [ ] Implémenter le monitoring avancé (Sentry, DataDog)
- [ ] Optimiser les performances (caching, indexation BDD)
- [ ] Documenter les procédures d'urgence

##  Checklist de Déploiement

Avant de déployer :

- [ ] Code testé localement
- [ ] Migrations Prisma créées et testées
- [ ] `.env.example` à jour
- [ ] `package.json` contient tous les scripts nécessaires
- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement préparées
- [ ] `JWT_SECRET` généré

Après le déploiement :

- [ ] Health check répond
- [ ] API accessible depuis Vercel
- [ ] Authentification fonctionne
- [ ] Base de données accessible
- [ ] Logs sans erreurs critiques

---

**Besoin d'aide ?** Consultez [CHECKLIST_DEPLOIEMENT.md](./CHECKLIST_DEPLOIEMENT.md) ou la [documentation Render](https://render.com/docs).
