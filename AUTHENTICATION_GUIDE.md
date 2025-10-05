# Guide d'Authentification - SFA CRM

Ce guide décrit toutes les fonctionnalités d'authentification implémentées dans le système.

## Table des matières

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Migration de la base de données](#migration)
4. [Endpoints disponibles](#endpoints)
5. [Exemples de requêtes](#exemples)

---

## Installation

### 1. Installer les dépendances nécessaires

```bash
npm install @nestjs/throttler speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### 2. Packages installés

- `@nestjs/throttler` - Rate limiting pour protéger contre les attaques par force brute
- `speakeasy` - Génération et vérification de codes TOTP pour 2FA
- `qrcode` - Génération de QR codes pour Google Authenticator

---

## Configuration

### Variables d'environnement (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# Frontend URL (pour CORS)
FRONTEND_URL="http://localhost:5173"

# Email Configuration (optionnel - pour reset password)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="noreply@sfa-crm.com"
```

---

## Migration

### 1. Générer le client Prisma

```bash
npx prisma generate
```

### 2. Créer et appliquer la migration

```bash
npx prisma migrate dev --name add_auth_features
```

### 3. Vérifier la migration

```bash
npx prisma studio
```

---

## Endpoints disponibles

### Authentification de base

#### 1. Inscription
- **POST** `/auth/register`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "random-hex-string"
}
```

#### 2. Connexion
- **POST** `/auth/login`
- **Rate Limit:** 5 tentatives par 15 minutes
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "twoFactorCode": "123456"  // Optionnel, requis si 2FA activé
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "random-hex-string"
}
```

#### 3. Profil utilisateur
- **GET** `/auth/profile`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### SCRUM-38: Récupération de mot de passe

#### 1. Demander la réinitialisation
- **POST** `/auth/forgot-password`
- **Rate Limit:** 3 tentatives par heure
- **Body:**
```json
{
  "email": "user@example.com"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Email de réinitialisation envoyé"
}
```

#### 2. Réinitialiser le mot de passe
- **POST** `/auth/reset-password`
- **Body:**
```json
{
  "token": "token-from-email",
  "newPassword": "NewSecurePass123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

### SCRUM-40: Authentification à deux facteurs (2FA)

#### 1. Générer le QR code
- **POST** `/auth/2fa/generate`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:**
```json
{
  "success": true,
  "message": "QR code généré avec succès",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

#### 2. Activer 2FA
- **POST** `/auth/2fa/enable`
- **Headers:** `Authorization: Bearer {access_token}`
- **Body:**
```json
{
  "code": "123456"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "2FA activé avec succès",
  "twoFactorEnabled": true
}
```

#### 3. Vérifier un code 2FA
- **POST** `/auth/2fa/verify`
- **Headers:** `Authorization: Bearer {access_token}`
- **Body:**
```json
{
  "code": "123456"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Code 2FA vérifié",
  "twoFactorEnabled": true
}
```

#### 4. Désactiver 2FA
- **POST** `/auth/2fa/disable`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:**
```json
{
  "success": true,
  "message": "2FA désactivé avec succès",
  "twoFactorEnabled": false
}
```

---

### Bonus: Refresh Token & Logout

#### 1. Rafraîchir le token
- **POST** `/auth/refresh`
- **Body:**
```json
{
  "refreshToken": "random-hex-string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Token rafraîchi avec succès",
  "access_token": "new-access-token",
  "refresh_token": "new-refresh-token"
}
```

#### 2. Déconnexion
- **POST** `/auth/logout`
- **Headers:** `Authorization: Bearer {access_token}`
- **Body:**
```json
{
  "refreshToken": "random-hex-string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

#### 3. Déconnexion de tous les appareils
- **POST** `/auth/logout-all`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:**
```json
{
  "success": true,
  "message": "Déconnecté de tous les appareils"
}
```

---

## Exemples de requêtes

### Avec cURL

#### Inscription
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

#### Profil (avec token)
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Mot de passe oublié
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

#### Générer 2FA
```bash
curl -X POST http://localhost:3000/auth/2fa/generate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Activer 2FA
```bash
curl -X POST http://localhost:3000/auth/2fa/enable \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

---

## Fonctionnalités de sécurité

### SCRUM-39: Protection contre les tentatives non autorisées

1. **Rate Limiting global**: 10 requêtes par minute par IP
2. **Rate Limiting login**: 5 tentatives par 15 minutes
3. **Rate Limiting forgot-password**: 3 tentatives par heure
4. **Blocage de compte**: Après 5 échecs de connexion, le compte est verrouillé pendant 30 minutes
5. **Logging des tentatives**: Toutes les tentatives de connexion sont enregistrées avec IP et User-Agent
6. **Tracking des tentatives échouées**: Compteur par email avec fenêtre glissante de 15 minutes

### Tokens

1. **Access Token**: Expire après 15 minutes
2. **Refresh Token**: Expire après 7 jours
3. **Reset Token**: Expire après 1 heure
4. **Tous les tokens sont hashés** avant d'être stockés en base de données

### 2FA

1. **TOTP (Time-based One-Time Password)**: Compatible avec Google Authenticator, Authy, etc.
2. **Fenêtre de validation**: ±2 intervalles (60 secondes) pour tenir compte du décalage d'horloge
3. **Secret unique par utilisateur**: Généré avec 32 caractères aléatoires

---

## Codes d'erreur

| Code | Message | Description |
|------|---------|-------------|
| 401 | Email ou mot de passe incorrect | Identifiants invalides |
| 401 | Compte temporairement verrouillé | Trop de tentatives échouées |
| 401 | Code 2FA requis | 2FA activé mais code non fourni |
| 401 | Code 2FA invalide | Code 2FA incorrect |
| 400 | Token de réinitialisation invalide ou expiré | Reset token invalide |
| 400 | 2FA déjà activé | Tentative d'activation alors que déjà actif |
| 400 | 2FA non activé | Tentative de vérification sans activation |
| 409 | Cet email est déjà utilisé | Email déjà enregistré |

---

## Base de données

### Nouvelles tables

#### `login_attempt`
- Tracking de toutes les tentatives de connexion
- Champs: userId, email, ip, userAgent, success, reason, createdAt

#### `refresh_token`
- Stockage des refresh tokens
- Champs: userId, token, expiresAt, createdAt, revokedAt, ip, userAgent

### Nouveaux champs User

- `lockedUntil`: Date de fin de verrouillage du compte
- `resetToken`: Token hashé de réinitialisation
- `resetTokenExpiry`: Date d'expiration du reset token
- `twoFactorSecret`: Secret TOTP pour 2FA
- `twoFactorEnabled`: Boolean indiquant si 2FA est actif
- `emailVerified`: Boolean indiquant si l'email est vérifié
- `emailVerificationToken`: Token de vérification d'email

---

## Tests

### Tester le rate limiting

```bash
# Faire 6 requêtes rapides pour déclencher le rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
```

### Tester le blocage de compte

```bash
# Faire 5 tentatives de connexion échouées
for i in {1..5}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","password":"WrongPassword"}'
  sleep 1
done

# La 6ème tentative devrait retourner "Compte temporairement verrouillé"
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"CorrectPassword"}'
```

---

## Notes importantes

1. **Sécurité en production**:
   - Changez tous les secrets dans les variables d'environnement
   - Utilisez HTTPS pour toutes les requêtes
   - Configurez correctement CORS
   - Activez les logs de sécurité

2. **Email**:
   - Configurez un service d'email (SendGrid, AWS SES, etc.)
   - Implémentez les templates d'email pour reset password
   - Ajoutez la vérification d'email à l'inscription

3. **2FA**:
   - Fournissez des codes de secours à l'utilisateur
   - Permettez la désactivation via email si l'utilisateur perd son appareil
   - Documentez le processus pour les utilisateurs

4. **Monitoring**:
   - Surveillez les tentatives de connexion suspectes
   - Alertez en cas d'activité anormale
   - Gardez des logs d'audit

---

## Prochaines étapes

1. Implémenter l'envoi d'emails réels pour reset password
2. Ajouter la vérification d'email à l'inscription
3. Implémenter des codes de secours pour 2FA
4. Ajouter des tests unitaires et e2e
5. Documenter l'API avec Swagger/OpenAPI
6. Implémenter la rotation automatique des secrets
7. Ajouter un système de notifications de sécurité

---

## Support

Pour toute question ou problème, consultez la documentation NestJS ou ouvrez une issue sur le repository du projet.
