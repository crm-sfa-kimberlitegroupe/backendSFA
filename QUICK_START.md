#  Guide de Démarrage Rapide - SFA Backend

## Étapes pour démarrer le projet

### 1️⃣ Configurer la base de données

Créez un fichier `.env` à la racine du projet :

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/sfa_db?schema=public"
JWT_SECRET="votre-secret-jwt-super-securise"
JWT_EXPIRES_IN="7d"
```

### 2️⃣ Créer la base de données PostgreSQL

```bash
# Ouvrez psql
psql -U postgres

# Créez la base de données
CREATE DATABASE sfa_db;

# Quittez
\q
```

### 3️⃣ Générer le client Prisma

```bash
npm run prisma:generate
```

Cette commande génère le client Prisma TypeScript basé sur votre schéma.

### 4️⃣ Créer et appliquer les migrations

```bash
npm run prisma:migrate
```

Nommez votre migration (ex: "init")

### 5️⃣ (Optionnel) Remplir avec des données de test

```bash
npm run prisma:seed
```

Cela créera un utilisateur admin par défaut :
- **Email**: admin@sfa.com
- **Password**: admin123

### 6️⃣ Démarrer le serveur

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`

## 🧪 Tester l'API

### Inscription
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Connexion
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@sfa.com",
  "password": "admin123"
}
```

## 📊 Prisma Studio (Interface graphique)

Pour visualiser et modifier vos données :

```bash
npm run prisma:studio
```

Ouvre une interface web sur `http://localhost:5555`

## 🔧 Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:migrate` | Crée une nouvelle migration |
| `npm run prisma:studio` | Ouvre l'interface graphique |
| `npm run prisma:seed` | Remplit la DB avec des données |
| `npx prisma migrate reset` | Réinitialise la DB (⚠️ supprime tout) |
| `npx prisma db push` | Synchronise le schéma sans migration |

## 📁 Structure du projet

```
backend-sfa/
├── prisma/
│   ├── schema.prisma      # Schéma de la base de données
│   └── seed.ts            # Données de test
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth/              # Module d'authentification
│   ├── users/             # Module utilisateurs
│   └── app.module.ts
└── .env                   # Variables d'environnement
```

## ✅ Vérification

Après ces étapes, vous devriez avoir :
- ✅ Base de données PostgreSQL créée
- ✅ Client Prisma généré
- ✅ Migrations appliquées (21 tables créées)
- ✅ Utilisateur admin créé
- ✅ Serveur démarré sur le port 3000

## 🆘 Problèmes courants

### Erreur de connexion à PostgreSQL
- Vérifiez que PostgreSQL est démarré
- Vérifiez les credentials dans `.env`

### Erreurs TypeScript sur Prisma
- Exécutez `npm run prisma:generate`

### Tables non créées
- Exécutez `npm run prisma:migrate`

## 📚 Documentation complète

Consultez `PRISMA_SETUP.md` pour plus de détails sur Prisma.
