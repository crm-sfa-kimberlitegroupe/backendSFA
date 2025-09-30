# Installation du Backend

## 1. Installer les dépendances

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/config
npm install -D @types/passport-jwt @types/bcrypt
```

## 2. Démarrer le serveur

```bash
npm run start:dev
```

Le backend sera accessible sur : **http://localhost:3000/api**

## 3. Routes API disponibles

### Auth Routes

- **POST** `/api/auth/register` - Inscription
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- **POST** `/api/auth/login` - Connexion
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **GET** `/api/auth/profile` - Obtenir le profil (nécessite un token JWT)
  - Header: `Authorization: Bearer <token>`

- **GET** `/api/auth/test` - Tester si l'API fonctionne

## 4. Structure du projet

```
src/
├── auth/                    # Module d'authentification
│   ├── dto/                # Data Transfer Objects
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/             # Guards pour protéger les routes
│   │   └── jwt-auth.guard.ts
│   ├── strategies/         # Stratégies Passport
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts  # Controller avec les routes
│   ├── auth.service.ts     # Logique métier
│   └── auth.module.ts      # Module NestJS
├── users/                   # Module utilisateurs
│   ├── dto/
│   │   └── create-user.dto.ts
│   ├── entities/
│   │   └── user.entity.ts
│   ├── users.service.ts    # Gestion des utilisateurs
│   └── users.module.ts
├── app.module.ts           # Module principal
└── main.ts                 # Point d'entrée
```

## 5. Configuration

Le backend utilise :
- **Port** : 3000 (configurable via `PORT` env variable)
- **JWT Secret** : Défini dans `auth.module.ts` (à déplacer dans `.env` en production)
- **CORS** : Activé pour `http://localhost:5173` (frontend React)
