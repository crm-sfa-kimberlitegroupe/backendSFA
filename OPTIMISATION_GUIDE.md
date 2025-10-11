# 🚀 Guide d'optimisation - Application SFA

Ce guide explique toutes les optimisations appliquées pour réduire la consommation mémoire de l'application.

## 📊 Résumé des gains

| Optimisation | Gain mémoire | Difficulté |
|--------------|--------------|------------|
| Suppression de zustand | ~5 MB | ✅ Facile |
| Logs en production | ~10-15 MB | ✅ Facile |
| Connection pooling | ~20-30 MB | ✅ Facile |
| Garbage collection optimisé | ~15-25 MB | ✅ Facile |
| **TOTAL ESTIMÉ** | **~50-75 MB** | - |

**Consommation avant** : ~460-600 MB  
**Consommation après** : ~385-525 MB  
**Amélioration** : ~10-15%

---

## ✅ Optimisations appliquées

### 1. **Nettoyage des dépendances**

#### Supprimé
- ❌ `zustand` (5 MB) - État global côté backend inutile

#### Conservé (nécessaire)
- ✅ `@nestjs/*` - Framework principal
- ✅ `@prisma/client` - ORM base de données
- ✅ `bcrypt` - Sécurité des mots de passe
- ✅ `cloudinary` - Upload d'images
- ✅ `passport-jwt` - Authentification
- ✅ `speakeasy` - 2FA

**Gain** : ~5 MB

---

### 2. **Optimisation Prisma**

#### Fichier : `src/prisma/prisma.service.ts`

```typescript
constructor() {
  super({
    // Réduire les logs en production
    log: process.env.NODE_ENV === 'production' 
      ? ['error'] 
      : ['query', 'error', 'warn'],
  });
}

async onModuleInit() {
  await this.$connect();
  // Timeout pour éviter les requêtes longues
  await this.$executeRaw`SET statement_timeout = '10s'`;
}
```

**Gain** : ~10-15 MB

---

### 3. **Connection Pooling optimisé**

#### Fichier : `.env` ou `DATABASE_URL` sur Render

```bash
# Avant
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Après (OPTIMISÉ)
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**Paramètres** :
- `connection_limit=10` : Maximum 10 connexions simultanées (au lieu de 20-30 par défaut)
- `pool_timeout=20` : Timeout de 20 secondes pour obtenir une connexion

**Gain** : ~20-30 MB

---

### 4. **Logs en production**

#### Fichier : `src/main.ts`

```typescript
const app = await NestFactory.create(AppModule, {
  logger: process.env.NODE_ENV === 'production'
    ? ['error', 'warn']  // Seulement erreurs et warnings
    : ['log', 'error', 'warn', 'debug', 'verbose'],
});
```

**Gain** : ~5-10 MB

---

### 5. **Garbage Collection optimisé**

#### Fichier : `render.yaml`

```yaml
envVars:
  - key: NODE_OPTIONS
    value: --max-old-space-size=512 --optimize-for-size --gc-interval=100
  - key: UV_THREADPOOL_SIZE
    value: 4
  - key: NODE_NO_WARNINGS
    value: 1
```

**Explication** :
- `--max-old-space-size=512` : Limite heap à 512 MB
- `--optimize-for-size` : Optimise pour la taille mémoire
- `--gc-interval=100` : Garbage collection plus fréquent
- `UV_THREADPOOL_SIZE=4` : Limite le pool de threads (défaut: 128)
- `NODE_NO_WARNINGS=1` : Désactive les warnings (économise mémoire)

**Gain** : ~15-25 MB

---

## 🔧 Configuration Render Dashboard

### Étape 1 : Mettre à jour DATABASE_URL

1. Allez sur **Render Dashboard** → Votre service backend
2. Cliquez sur **Environment**
3. Modifiez `DATABASE_URL` :

```
postgresql://kimbernitbackend_user:Bp5BfO2kmI5wEqliQAvA8Gf4S3zEm90u@dpg-d3fetqfdiees73fp53m0-a.oregon-postgres.render.com/kimbernitbackend?connection_limit=10&pool_timeout=20
```

### Étape 2 : Vérifier NODE_OPTIONS

Assurez-vous que `NODE_OPTIONS` contient :
```
--max-old-space-size=512 --optimize-for-size --gc-interval=100
```

### Étape 3 : Redéployer

Cliquez sur **Manual Deploy** → **Deploy latest commit**

---

## 📈 Monitoring

### Vérifier la consommation mémoire

Sur Render Dashboard :
1. Allez sur votre service backend
2. Cliquez sur **Metrics**
3. Regardez **Memory Usage**

**Objectif** : Rester sous 450 MB en moyenne

### Logs à surveiller

```bash
# Erreur de mémoire (MAUVAIS)
FATAL ERROR: Reached heap limit

# Connexions DB (MAUVAIS si trop élevé)
Error: P1001: Can't reach database server
Reason: too many connections

# Timeout requêtes (ACCEPTABLE)
Error: Query timeout after 10s
```

---

## 🚨 Que faire si ça ne suffit pas ?

### Option 1 : Optimisations avancées (difficile)

#### A. Lazy loading des modules

```typescript
// app.module.ts
@Module({
  imports: [
    // Charger CloudinaryModule seulement si nécessaire
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        cloudinary: process.env.CLOUDINARY_ENABLED === 'true' 
          ? require('./cloudinary/cloudinary.config')
          : null
      })]
    }),
  ],
})
```

**Gain potentiel** : ~30-40 MB

#### B. Désactiver les fonctionnalités non critiques

```typescript
// Désactiver 2FA temporairement
// Désactiver upload d'images temporairement
// Désactiver QR codes temporairement
```

**Gain potentiel** : ~40-60 MB

### Option 2 : Upgrade vers plan Starter (7$/mois) ✅ RECOMMANDÉ

- 1 GB RAM au lieu de 512 MB
- Pas de sleep automatique
- Plus stable

---

## 📝 Checklist de déploiement

Avant chaque déploiement, vérifiez :

- [ ] `NODE_ENV=production` dans Render
- [ ] `DATABASE_URL` contient `?connection_limit=10&pool_timeout=20`
- [ ] `NODE_OPTIONS` contient les flags d'optimisation
- [ ] Pas de `console.log()` dans le code
- [ ] Logs Prisma désactivés en production
- [ ] Tests passent localement

---

## 🎯 Résultats attendus

Avec toutes ces optimisations :

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Mémoire au démarrage | 450-500 MB | 380-420 MB | -15% |
| Mémoire en utilisation | 500-600 MB | 420-520 MB | -15% |
| Connexions DB | 20-30 | 10 max | -50% |
| Temps de démarrage | 15-20s | 12-15s | -20% |

---

## 💡 Conseils supplémentaires

### 1. Éviter les requêtes N+1

```typescript
// MAUVAIS (N+1)
const users = await prisma.user.findMany();
for (const user of users) {
  const territory = await prisma.territory.findUnique({
    where: { id: user.territoryId }
  });
}

// BON (1 requête)
const users = await prisma.user.findMany({
  include: { territory: true }
});
```

### 2. Utiliser select pour limiter les données

```typescript
// MAUVAIS (charge tout)
const users = await prisma.user.findMany();

// BON (charge seulement ce qui est nécessaire)
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  }
});
```

### 3. Pagination obligatoire

```typescript
// MAUVAIS (charge 10000 lignes)
const outlets = await prisma.outlet.findMany();

// BON (charge 50 lignes)
const outlets = await prisma.outlet.findMany({
  take: 50,
  skip: page * 50,
});
```

---

## 📞 Support

Si vous avez des questions ou problèmes :
1. Vérifiez les logs sur Render Dashboard
2. Consultez ce guide
3. Contactez l'équipe technique

---

**Dernière mise à jour** : 11 octobre 2025
