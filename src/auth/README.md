# Auth Module

Module d'authentification JWT pour l'application SFA.

##  Structure

```
auth/
├── config/              # Configuration JWT
│   ├── jwt.config.ts   # Configuration du module JWT
│   └── index.ts
├── constants/           # Constantes et messages
│   ├── auth.constants.ts
│   └── index.ts
├── decorators/          # Décorateurs personnalisés
│   ├── get-user.decorator.ts  # Extrait l'utilisateur de la requête
│   └── index.ts
├── dto/                 # Data Transfer Objects
│   ├── login.dto.ts    # DTO pour la connexion
│   ├── register.dto.ts # DTO pour l'inscription
│   └── index.ts
├── guards/              # Guards d'authentification
│   ├── jwt-auth.guard.ts  # Guard JWT
│   └── index.ts
├── interfaces/          # Interfaces TypeScript
│   ├── jwt-payload.interface.ts      # Payload du token JWT
│   ├── auth-response.interface.ts    # Réponses d'authentification
│   ├── request-with-user.interface.ts # Requête avec utilisateur
│   └── index.ts
├── strategies/          # Stratégies Passport
│   ├── jwt.strategy.ts # Stratégie JWT
│   └── index.ts
├── auth.controller.ts   # Contrôleur d'authentification
├── auth.service.ts      # Service d'authentification
├── auth.module.ts       # Module d'authentification
├── index.ts            # Exports du module
└── README.md           # Documentation
```

##  Utilisation

### Endpoints disponibles

#### POST /api/auth/register
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Réponse:**
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
  "access_token": "jwt_token"
}
```

#### POST /api/auth/login
Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Réponse:**
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
  "access_token": "jwt_token"
}
```

#### GET /api/auth/profile
Récupère le profil de l'utilisateur authentifié (nécessite un token JWT).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Réponse:**
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

#### GET /api/auth/health
Vérification de l'état du module d'authentification.

**Réponse:**
```json
{
  "success": true,
  "message": "Auth module is running",
  "timestamp": "2025-10-02T20:00:00.000Z"
}
```

##  Protection des routes

### Utiliser le Guard JWT

Pour protéger une route avec JWT:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards';
import { GetUser } from './auth/decorators';
import type { RequestUser } from './auth/interfaces';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData(@GetUser() user: RequestUser) {
    return {
      message: 'Données protégées',
      userId: user.userId,
      email: user.email,
    };
  }
}
```

### Décorateur @GetUser()

Le décorateur `@GetUser()` permet d'extraire facilement les informations de l'utilisateur authentifié:

```typescript
// Récupérer l'utilisateur complet
@GetUser() user: RequestUser

// Récupérer uniquement l'ID
@GetUser('userId') userId: string

// Récupérer uniquement l'email
@GetUser('email') email: string
```

##  Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet:

```env
# JWT Configuration
JWT_SECRET=votre-secret-jwt-super-securise-changez-moi
JWT_EXPIRATION=24h

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sfa_db"

# Server
PORT=3000
```

 **Important:** Ne jamais commiter le fichier `.env` dans Git!

### Constantes

Les constantes sont définies dans `constants/auth.constants.ts`:

- `AUTH_CONSTANTS`: Configuration (durées, longueurs, etc.)
- `AUTH_ERRORS`: Messages d'erreur
- `AUTH_MESSAGES`: Messages de succès

##  Tests

Pour tester les endpoints avec curl:

```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","firstName":"Test","lastName":"User"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Profil (remplacer YOUR_TOKEN par le token reçu)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

##  Validation des données

### Règles de validation

**Email:**
- Doit être un email valide
- Requis

**Mot de passe:**
- Minimum 8 caractères
- Maximum 128 caractères
- Doit contenir au moins une majuscule, une minuscule et un chiffre
- Requis

**Prénom et Nom:**
- Minimum 2 caractères
- Maximum 50 caractères
- Requis

## Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 24h par défaut
- Les erreurs d'authentification ne révèlent pas si l'email existe
- Validation stricte des données d'entrée avec class-validator

## Architecture

Le module suit les principes de Clean Architecture:

1. **Controllers**: Gèrent les requêtes HTTP
2. **Services**: Contiennent la logique métier
3. **DTOs**: Valident et typent les données d'entrée
4. **Interfaces**: Définissent les contrats TypeScript
5. **Guards**: Protègent les routes
6. **Strategies**: Implémentent les stratégies d'authentification Passport
7. **Decorators**: Simplifient l'extraction de données
8. **Constants**: Centralisent les valeurs fixes

## Développement

### Ajouter une nouvelle stratégie d'authentification

1. Créer un fichier dans `strategies/`
2. Implémenter la stratégie Passport
3. Ajouter le provider dans `auth.module.ts`
4. Créer un guard correspondant dans `guards/`

### Personnaliser les réponses

Modifier les interfaces dans `interfaces/auth-response.interface.ts`

### Ajouter des constantes

Ajouter dans `constants/auth.constants.ts`
