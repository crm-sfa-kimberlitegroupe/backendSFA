# Instructions d'installation - Fonctionnalités d'authentification

## Étapes à suivre pour finaliser l'installation

### 1. Installer les packages npm manquants

```bash
cd c:\Users\OFFO ANGE EMMANUEL\Desktop\SFA\backendSFA\backend-sfa

# Installer les dépendances pour 2FA
npm install speakeasy qrcode

# Installer les types TypeScript
npm install --save-dev @types/speakeasy @types/qrcode
```

### 2. Remplacer les fichiers modifiés

Les fichiers suivants ont été créés avec l'extension `.new` et doivent remplacer les originaux :

```bash
# Remplacer auth.service.ts
del src\auth\auth.service.ts
ren src\auth\auth.service.new.ts auth.service.ts

# Remplacer auth.controller.ts
del src\auth\auth.controller.ts
ren src\auth\auth.controller.new.ts auth.controller.ts
```

**OU manuellement dans l'IDE :**
- Supprimer `src/auth/auth.service.ts`
- Renommer `src/auth/auth.service.new.ts` en `auth.service.ts`
- Supprimer `src/auth/auth.controller.ts`
- Renommer `src/auth/auth.controller.new.ts` en `auth.controller.ts`

### 3. Générer le client Prisma avec les nouveaux champs

```bash
npx prisma generate
```

### 4. Créer et appliquer la migration de base de données

```bash
# Créer la migration
npx prisma migrate dev --name add_advanced_auth_features

# Si vous avez des erreurs, vous pouvez forcer la migration
npx prisma migrate deploy
```

### 5. Vérifier la configuration des variables d'environnement

Assurez-vous que votre fichier `.env` contient toutes les variables nécessaires :

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRATION="7d"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 6. Compiler et démarrer l'application

```bash
# Compiler TypeScript
npm run build

# Démarrer en mode développement
npm run start:dev
```

### 7. Tester les endpoints

Une fois l'application démarrée, testez les endpoints :

```bash
# Test de santé
curl http://localhost:3000/auth/health

# Test d'inscription
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Résolution des problèmes courants

### Erreur : "Cannot find module 'speakeasy'"

**Solution :**
```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### Erreur : "Property 'lockedUntil' does not exist on type User"

**Solution :**
```bash
npx prisma generate
```
Cela régénère le client Prisma avec les nouveaux champs.

### Erreur de migration Prisma

**Solution :**
```bash
# Réinitialiser la base de données (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Ou créer une nouvelle migration
npx prisma migrate dev --name fix_schema
```

### Erreur : "Module '@nestjs/throttler' not found"

**Solution :**
```bash
npm install @nestjs/throttler
```

### Les erreurs TypeScript persistent

**Solution :**
1. Redémarrer le serveur TypeScript dans VSCode : `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Supprimer `node_modules` et réinstaller :
```bash
rmdir /s /q node_modules
npm install
```

## Vérification de l'installation

### 1. Vérifier que tous les packages sont installés

```bash
npm list speakeasy qrcode @nestjs/throttler
```

### 2. Vérifier que Prisma est à jour

```bash
npx prisma --version
npx prisma validate
```

### 3. Vérifier la structure de la base de données

```bash
npx prisma studio
```

Ouvrez Prisma Studio et vérifiez que les tables suivantes existent :
- `user` (avec les nouveaux champs : lockedUntil, resetToken, twoFactorSecret, etc.)
- `login_attempt`
- `refresh_token`

## Fichiers créés/modifiés

### Nouveaux fichiers créés :
- `src/auth/dto/forgot-password.dto.ts`
- `src/auth/dto/reset-password.dto.ts`
- `src/auth/dto/verify-2fa.dto.ts`
- `src/auth/dto/login-with-2fa.dto.ts`
- `src/auth/dto/refresh-token.dto.ts`
- `src/auth/interfaces/two-factor-response.interface.ts`
- `src/auth/interfaces/refresh-token-response.interface.ts`
- `src/auth/interfaces/password-reset-response.interface.ts`
- `src/auth/entities/login-attempt.entity.ts`
- `src/auth/entities/refresh-token.entity.ts`
- `src/auth/entities/index.ts`
- `AUTHENTICATION_GUIDE.md`
- `INSTALLATION_STEPS.md`

### Fichiers modifiés :
- `prisma/schema.prisma` (ajout de champs et tables)
- `src/auth/auth.service.ts` (toutes les nouvelles fonctionnalités)
- `src/auth/auth.controller.ts` (nouveaux endpoints)
- `src/auth/auth.module.ts` (ajout de ThrottlerModule)
- `src/auth/constants/auth.constants.ts` (nouvelles constantes)
- `src/auth/dto/index.ts` (exports)
- `src/auth/dto/login.dto.ts` (ajout du champ twoFactorCode)
- `src/auth/interfaces/index.ts` (exports)
- `src/auth/interfaces/auth-response.interface.ts` (ajout refresh_token)
- `src/users/entities/user.entity.ts` (nouveaux champs)
- `src/users/users.service.ts` (mapping des nouveaux champs)
- `.env.development` (nouvelles variables)

## Prochaines étapes après l'installation

1. **Tester tous les endpoints** avec Postman ou cURL
2. **Configurer l'envoi d'emails** pour le reset password
3. **Ajouter des tests unitaires** pour les nouvelles fonctionnalités
4. **Documenter l'API** avec Swagger
5. **Configurer le monitoring** des tentatives de connexion
6. **Implémenter la vérification d'email** (bonus)

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de l'application
2. Consultez le fichier `AUTHENTICATION_GUIDE.md`
3. Vérifiez que toutes les dépendances sont installées
4. Assurez-vous que la base de données est accessible

## Commandes utiles

```bash
# Voir les logs en temps réel
npm run start:dev

# Lancer les tests
npm test

# Vérifier le code
npm run lint

# Formater le code
npm run format

# Voir la structure de la base de données
npx prisma studio

# Créer une nouvelle migration
npx prisma migrate dev --name your_migration_name

# Appliquer les migrations en production
npx prisma migrate deploy
```
