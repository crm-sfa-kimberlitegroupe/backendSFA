# Endpoints API - Gestion des Ventes et Merchandising des Visites

## 📋 Vue d'ensemble

Endpoints backend implémentés pour gérer les ventes et merchandising associés aux visites.

## 🔐 Authentification

Tous les endpoints nécessitent :
- **JWT Token** dans le header `Authorization: Bearer <token>`
- **Rôle REP** (vendeur)

## 📍 Endpoints Ventes

### 1. Mettre à jour toutes les ventes d'une visite

```http
PUT /visits/:visitId/orders
```

**Body:**
```json
{
  "orderIds": ["order-id-1", "order-id-2", "order-id-3"]
}
```

**Réponse:**
```json
{
  "statusCode": 200,
  "message": "Ventes de la visite mises à jour avec succès",
  "data": {
    "id": "visit-id",
    "outletId": "outlet-id",
    "userId": "user-id",
    "orders": [...],
    "merchChecks": [...]
  }
}
```

**Validations:**
- Visite doit exister
- Visite doit appartenir à l'utilisateur
- Toutes les ventes doivent exister
- Toutes les ventes doivent appartenir à l'utilisateur

---

### 2. Ajouter une vente à une visite

```http
POST /visits/:visitId/orders/:orderId
```

**Paramètres:**
- `visitId` - ID de la visite
- `orderId` - ID de la vente à ajouter

**Réponse:**
```json
{
  "statusCode": 201,
  "message": "Vente ajoutée à la visite avec succès",
  "data": {
    "id": "visit-id",
    "orders": [...],
    "merchChecks": [...]
  }
}
```

**Validations:**
- Visite doit exister et appartenir à l'utilisateur
- Vente doit exister et appartenir à l'utilisateur

---

### 3. Supprimer une vente d'une visite

```http
DELETE /visits/:visitId/orders/:orderId
```

**Paramètres:**
- `visitId` - ID de la visite
- `orderId` - ID de la vente à supprimer

**Réponse:**
```json
{
  "statusCode": 200,
  "message": "Vente supprimée de la visite avec succès",
  "data": {
    "id": "visit-id",
    "orders": [...],
    "merchChecks": [...]
  }
}
```

**Effet:**
- La vente n'est pas supprimée de la base
- Le lien `visitId` de la vente est mis à `null`

---

## 🎨 Endpoints Merchandising

### 4. Mettre à jour tous les merchandising d'une visite

```http
PUT /visits/:visitId/merchandising
```

**Body:**
```json
{
  "merchIds": ["merch-id-1", "merch-id-2"]
}
```

**Réponse:**
```json
{
  "statusCode": 200,
  "message": "Merchandising de la visite mis à jour avec succès",
  "data": {
    "id": "visit-id",
    "orders": [...],
    "merchChecks": [...]
  }
}
```

**Validations:**
- Visite doit exister et appartenir à l'utilisateur
- Tous les merchandising doivent exister
- Tous les merchandising doivent appartenir à la visite

---

### 5. Ajouter un merchandising à une visite

```http
POST /visits/:visitId/merchandising/:merchId
```

**Paramètres:**
- `visitId` - ID de la visite
- `merchId` - ID du merchandising

**Réponse:**
```json
{
  "statusCode": 201,
  "message": "Merchandising ajouté à la visite avec succès",
  "data": {
    "id": "visit-id",
    "orders": [...],
    "merchChecks": [...]
  }
}
```

**Validations:**
- Visite doit exister et appartenir à l'utilisateur
- Merchandising doit exister
- Merchandising doit appartenir à la visite

---

### 6. Supprimer un merchandising d'une visite

```http
DELETE /visits/:visitId/merchandising/:merchId
```

**Paramètres:**
- `visitId` - ID de la visite
- `merchId` - ID du merchandising à supprimer

**Réponse:**
```json
{
  "statusCode": 200,
  "message": "Merchandising supprimé de la visite avec succès",
  "data": {
    "id": "visit-id",
    "orders": [...],
    "merchChecks": [...]
  }
}
```

**Effet:**
- Le merchandising est **supprimé définitivement** de la base de données

---

## 🔒 Sécurité

### Vérifications automatiques

Tous les endpoints vérifient :
1. **Authentification** - Token JWT valide
2. **Autorisation** - Rôle REP
3. **Propriété** - L'utilisateur est propriétaire de la visite
4. **Existence** - Les ressources existent

### Erreurs possibles

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Non authentifié"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Vous ne pouvez pas modifier une visite que vous n'avez pas créée"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Visite xxx introuvable"
}
```

---

## 💡 Exemples d'utilisation

### Scénario 1: Ajouter plusieurs ventes à une visite

```bash
# 1. Créer vente 1
POST /orders
Body: { ... }
Response: { "data": { "id": "order-1" } }

# 2. Ajouter vente 1 à la visite
POST /visits/visit-123/orders/order-1

# 3. Créer vente 2
POST /orders
Body: { ... }
Response: { "data": { "id": "order-2" } }

# 4. Ajouter vente 2 à la visite
POST /visits/visit-123/orders/order-2

# 5. Mettre à jour toutes les ventes (optionnel)
PUT /visits/visit-123/orders
Body: { "orderIds": ["order-1", "order-2"] }
```

### Scénario 2: Supprimer une vente d'une visite

```bash
# Supprimer la vente
DELETE /visits/visit-123/orders/order-1

# La vente existe toujours dans la base
# Mais n'est plus liée à la visite
```

### Scénario 3: Gérer le merchandising

```bash
# 1. Créer merchandising
POST /visits/visit-123/merch-check
Body: { "checklist": {...}, "photos": [...] }
Response: { "data": { "id": "merch-1" } }

# 2. Ajouter à la visite (déjà fait automatiquement)
POST /visits/visit-123/merchandising/merch-1

# 3. Supprimer si nécessaire
DELETE /visits/visit-123/merchandising/merch-1
```

---

## 🔄 Intégration Frontend

### Utilisation avec le store Zustand

```typescript
import { useVisitsStore } from '@/features/visits/stores/visitsStore';
import { visitsService } from '@/features/visits/services/visits.service';

// Ajouter une vente
const { addVenteId, getActiveVisit } = useVisitsStore();
const activeVisit = getActiveVisit(outletId);

// 1. Store local
addVenteId(outletId, orderId);

// 2. API sync
await visitsService.addOrderToVisit(activeVisit.visitId, orderId);
```

---

## 📊 Structure de données

### Visit (avec relations)
```typescript
{
  id: string;
  outletId: string;
  userId: string;
  checkinAt: Date;
  checkoutAt?: Date;
  orders: Order[];        // Ventes liées
  merchChecks: MerchCheck[]; // Merchandising liés
}
```

### Order
```typescript
{
  id: string;
  userId: string;
  outletId: string;
  visitId?: string;  // Lien vers la visite
  totalHt: Decimal;
  totalTtc: Decimal;
  // ...
}
```

### MerchCheck
```typescript
{
  id: string;
  visitId: string;  // Toujours lié à une visite
  checklist?: JSON;
  planogram?: JSON;
  score?: number;
  photos?: JSON;
}
```

---

## 🧪 Tests

### Tester avec cURL

```bash
# Ajouter une vente
curl -X POST http://localhost:3000/visits/visit-123/orders/order-456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Mettre à jour toutes les ventes
curl -X PUT http://localhost:3000/visits/visit-123/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderIds": ["order-1", "order-2"]}'

# Supprimer une vente
curl -X DELETE http://localhost:3000/visits/visit-123/orders/order-456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notes importantes

1. **Les ventes ne sont jamais supprimées** - Seul le lien avec la visite est retiré
2. **Les merchandising sont supprimés définitivement** - Attention lors de la suppression
3. **Toutes les opérations sont atomiques** - Pas de données incohérentes
4. **Les validations sont strictes** - Sécurité maximale
5. **Les réponses incluent toujours les relations** - `orders` et `merchChecks`
