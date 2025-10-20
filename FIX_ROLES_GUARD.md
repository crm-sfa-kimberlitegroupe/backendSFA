# 🔒 Fix : Permissions de Validation/Rejet des PDV

## 🐛 Problème

```
Error: Forbidden resource
```

Les utilisateurs ADMIN ne pouvaient pas valider ou rejeter les PDV, même avec les bonnes permissions.

## 🔍 Cause Racine

La stratégie JWT (`jwt.strategy.ts`) ne retournait **pas le rôle** de l'utilisateur dans le `RequestUser`.

### Avant (Incorrect)

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload): Promise<RequestUser> {
  const user = await this.authService.validateUser(payload.sub);
  
  return {
    userId: payload.sub,
    email: payload.email,
    // ❌ Pas de role !
  };
}
```

### Conséquence

Le `RolesGuard` vérifie `user.role` :

```typescript
// roles.guard.ts
if (!user || !user.role) {
  return false; // ❌ Toujours false car role est undefined
}

return requiredRoles.some((role) => user.role === role);
```

**Résultat** : Toutes les requêtes avec `@Roles('ADMIN', 'SUP')` étaient rejetées.

## ✅ Solution Appliquée

### Fichier : `jwt.strategy.ts` (ligne 30)

```typescript
async validate(payload: JwtPayload): Promise<RequestUser> {
  const user = await this.authService.validateUser(payload.sub);

  if (!user) {
    throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
  }

  return {
    userId: payload.sub,
    email: payload.email,
    role: user.role, // ✅ Ajouter le rôle
  };
}
```

## 📊 Flux de Données

```
┌─────────────────────────────────────────────────────────┐
│  1. Utilisateur se connecte                             │
│     ↓                                                   │
│  2. Backend génère JWT avec payload                     │
│     { sub: userId, email: "...", ... }                 │
│     ↓                                                   │
│  3. Frontend envoie requête avec token                  │
│     Authorization: Bearer <token>                       │
│     ↓                                                   │
│  4. JwtStrategy.validate() décode le token              │
│     ↓                                                   │
│  5. Récupère user depuis DB                             │
│     ↓                                                   │
│  6. Retourne RequestUser avec role ✅                   │
│     { userId, email, role: "ADMIN" }                   │
│     ↓                                                   │
│  7. RolesGuard vérifie user.role                        │
│     ✅ user.role === "ADMIN" → Accès autorisé          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Endpoints Protégés

Les endpoints suivants nécessitent maintenant les bons rôles :

| Endpoint | Méthode | Rôles Requis | Description |
|----------|---------|--------------|-------------|
| `/outlets/:id/approve` | PATCH | ADMIN, SUP | Valider un PDV |
| `/outlets/:id/reject` | PATCH | ADMIN, SUP | Rejeter un PDV |
| `/outlets/:id` | DELETE | ADMIN | Supprimer un PDV |

## ⚠️ Actions Requises

### 1. Redémarrer le Backend

```bash
cd backend-sfa
npm run start:dev
```

### 2. Se Reconnecter (Frontend)

**Les utilisateurs doivent se reconnecter** pour obtenir un nouveau token avec le rôle.

```javascript
// Dans la console du navigateur (F12)
localStorage.clear();
location.reload();
```

Puis reconnectez-vous avec vos identifiants ADMIN.

### 3. Vérifier le Token

Pour vérifier que le token contient maintenant le rôle :

```javascript
// Console du navigateur
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
// Devrait afficher : { sub: "...", email: "...", iat: ..., exp: ... }
```

**Note** : Le rôle n'est pas dans le JWT payload, il est récupéré depuis la DB lors de la validation.

## 🧪 Tests

### Test 1 : Validation d'un PDV (ADMIN)

```bash
1. Se connecter en tant qu'ADMIN
2. Aller dans Visites > À valider
3. Cliquer sur "Valider" pour un PDV
✅ Devrait afficher : "PDV validé avec succès"
```

### Test 2 : Rejet d'un PDV (ADMIN)

```bash
1. Cliquer sur "Rejeter" pour un PDV
2. Entrer une raison
3. Confirmer
✅ Devrait afficher : "PDV rejeté avec succès"
```

### Test 3 : Accès Refusé (REP)

```bash
1. Se connecter en tant que REP
2. Essayer d'accéder à /outlets/:id/approve via API
❌ Devrait retourner : 403 Forbidden
```

## 📝 Comptes de Test

| Email | Mot de passe | Rôle | Peut valider ? |
|-------|--------------|------|----------------|
| `admin@sfa.com` | `admin123` | ADMIN | ✅ Oui |
| `andrepierre585@gmail.com` | `admin123` | ADMIN | ✅ Oui |
| `sup@sfa.com` | `sup123` | SUP | ✅ Oui |
| `rep1@sfa.com` | `vendeur123` | REP | ❌ Non |

## 🔐 Sécurité

### Bonnes Pratiques Appliquées

1. ✅ **Vérification du rôle côté serveur** (RolesGuard)
2. ✅ **Pas de rôle dans le JWT payload** (évite la manipulation)
3. ✅ **Récupération du rôle depuis la DB** (source de vérité)
4. ✅ **Guards combinés** (JwtAuthGuard + RolesGuard)

### Architecture de Sécurité

```typescript
@Patch(':id/approve')
@UseGuards(JwtAuthGuard, RolesGuard) // Appliqué au niveau du contrôleur
@Roles('ADMIN', 'SUP')               // Rôles requis
approve(@Param('id') id: string) {
  // Code exécuté seulement si :
  // 1. Token JWT valide (JwtAuthGuard)
  // 2. user.role === 'ADMIN' ou 'SUP' (RolesGuard)
}
```

## 🎉 Résultat

- ✅ Les ADMIN peuvent valider/rejeter les PDV
- ✅ Les SUP peuvent valider/rejeter les PDV
- ❌ Les REP ne peuvent PAS valider/rejeter les PDV
- ✅ Sécurité renforcée avec vérification côté serveur

---

**Date** : 2025-10-19  
**Fichier modifié** : `src/auth/strategies/jwt.strategy.ts`  
**Impact** : Critique - Déblocage des permissions  
**Statut** : ✅ Résolu
