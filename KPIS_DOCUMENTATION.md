# Documentation des KPIs - API Endpoints

## Vue d'ensemble

Module de calcul des KPIs (Key Performance Indicators) commerciaux pour l'application SFA.

**Base URL**: `/api/kpis`

**Authentification**: Bearer Token (JWT) requis

**Rôles autorisés**: ADMIN, SUP, REP (sauf `/all` réservé à ADMIN/SUP)

---

## Endpoints disponibles

### 1. Chiffre d'Affaires (CA)

**GET** `/kpis/chiffres-affaires`

Mesure la performance globale des ventes sur une période.

**Formule**: `CA = ∑(Prix de vente × Quantités vendues)`

**Réponse**:
```json
{
  "value": 15000000,
  "unit": "FCFA",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "orderCount": 45,
  "totalHt": 12605042,
  "totalTtc": 15000000,
  "totalTax": 2394958
}
```

---

### 2. Dropsize (Taille de Commande)

**GET** `/kpis/dropsize`

Évalue l'efficacité de la vente additionnelle et du panier moyen.

**Formule**: `Dropsize = CA Total / Nombre de commandes`

**Réponse**:
```json
{
  "value": 333333.33,
  "unit": "FCFA",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "orderCount": 45,
  "totalAmount": 15000000,
  "averageOrderSize": 333333.33
}
```

---

### 3. LPC (Lignes Par Commande)

**GET** `/kpis/lpc`

Mesure la diversité des produits achetés lors d'une transaction.

**Formule**: `LPC = Nombre total de lignes / Nombre de commandes`

**Réponse**:
```json
{
  "value": 3.8,
  "unit": "lignes",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "totalLines": 171,
  "orderCount": 45,
  "linesPerOrder": 3.8
}
```

---

### 4. Taux de Couverture Client

**GET** `/kpis/taux-couverture`

Mesure l'atteinte du portefeuille client cible.

**Formule**: `Couverture = (Clients visités / Clients cible) × 100`

**Réponse**:
```json
{
  "value": 78.5,
  "unit": "%",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "targetClients": 200,
  "visitedClients": 157,
  "coverageRate": 78.5
}
```

---

### 5. Hit Rate (Taux de Succès des Visites)

**GET** `/kpis/hit-rate`

Mesure l'efficacité de la visite à générer une transaction.

**Formule**: `Hit Rate = (Visites avec vente / Total visites) × 100`

**Réponse**:
```json
{
  "value": 65.2,
  "unit": "%",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "totalVisits": 180,
  "visitsWithSale": 117,
  "hitRate": 65.2
}
```

---

### 6. Fréquence Moyenne de Visite

**GET** `/kpis/frequence-visite`

Assure une présence régulière et optimale chez les clients.

**Formule**: `Fréquence = Nombre de visites / Clients uniques visités`

**Réponse**:
```json
{
  "value": 2.3,
  "unit": "visites",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "totalVisits": 180,
  "uniqueClients": 78,
  "averageFrequency": 2.3
}
```

---

### 7. Vente Moyenne Par Visite

**GET** `/kpis/vente-par-visite`

Mesure la valeur générée par chaque interaction commerciale.

**Formule**: `Vente/Visite = CA des visites avec vente / Nombre de visites avec vente`

**Réponse**:
```json
{
  "value": 128205.13,
  "unit": "FCFA",
  "period": "month",
  "startDate": "2025-11-12T00:00:00.000Z",
  "endDate": "2025-12-12T00:00:00.000Z",
  "totalSales": 15000000,
  "visitsWithSale": 117,
  "averageSalePerVisit": 128205.13
}
```

---

### 8. Tous les KPIs

**GET** `/kpis/all`

Récupère tous les KPIs en une seule requête (optimisé avec Promise.all).

**Rôles**: ADMIN, SUP uniquement

**Réponse**:
```json
{
  "chiffresAffaires": { ... },
  "dropsize": { ... },
  "lpc": { ... },
  "tauxCouverture": { ... },
  "hitRate": { ... },
  "frequenceVisite": { ... },
  "venteParVisite": { ... }
}
```

---

## Paramètres de requête (Query Parameters)

Tous les endpoints acceptent les mêmes paramètres optionnels:

| Paramètre | Type | Valeurs | Description |
|-----------|------|---------|-------------|
| `period` | enum | `day`, `week`, `month`, `quarter`, `year`, `custom` | Période de calcul (défaut: `month`) |
| `startDate` | ISO 8601 | `2025-01-01T00:00:00.000Z` | Date de début (requis si `period=custom`) |
| `endDate` | ISO 8601 | `2025-12-31T23:59:59.999Z` | Date de fin (requis si `period=custom`) |
| `vendorId` | UUID | `123e4567-e89b-12d3-a456-426614174000` | Filtrer par vendeur |
| `sectorId` | UUID | `123e4567-e89b-12d3-a456-426614174000` | Filtrer par secteur |
| `territoryId` | UUID | `123e4567-e89b-12d3-a456-426614174000` | Filtrer par territoire |

### Exemples d'utilisation

**KPI du jour**:
```
GET /kpis/chiffres-affaires?period=day
```

**KPI de la semaine dernière**:
```
GET /kpis/dropsize?period=week
```

**KPI personnalisé**:
```
GET /kpis/hit-rate?period=custom&startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

**KPI d'un vendeur spécifique**:
```
GET /kpis/frequence-visite?period=month&vendorId=123e4567-e89b-12d3-a456-426614174000
```

**KPI d'un secteur**:
```
GET /kpis/taux-couverture?period=quarter&sectorId=123e4567-e89b-12d3-a456-426614174000
```

**Tous les KPIs du mois**:
```
GET /kpis/all?period=month
```

---

## Calcul des périodes

| Period | Calcul |
|--------|--------|
| `day` | Aujourd'hui (00:00:00 → maintenant) |
| `week` | 7 derniers jours |
| `month` | 30 derniers jours |
| `quarter` | 90 derniers jours |
| `year` | 365 derniers jours |
| `custom` | Entre `startDate` et `endDate` |

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Paramètres invalides (ex: `custom` sans dates) |
| 401 | Non authentifié |
| 403 | Rôle insuffisant |
| 500 | Erreur serveur |

---

## Notes d'implémentation

### Performance
- Tous les KPIs utilisent des requêtes Prisma optimisées
- L'endpoint `/all` utilise `Promise.all` pour paralléliser les calculs
- Les filtres sont appliqués au niveau de la base de données

### Filtres
- Les filtres sont cumulatifs (AND logic)
- `vendorId` filtre directement sur `userId`
- `sectorId` et `territoryId` filtrent via la relation `user`

### Données
- Les montants sont en FCFA (Franc CFA)
- Les pourcentages sont arrondis à 1 décimale
- Les dates sont en UTC (ISO 8601)

---

## Exemples de cas d'usage

### Dashboard Admin
```javascript
// Récupérer tous les KPIs du mois
const kpis = await fetch('/api/kpis/all?period=month', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Performance d'un vendeur
```javascript
// KPIs d'un vendeur sur le trimestre
const vendorKpis = await fetch(
  `/api/kpis/all?period=quarter&vendorId=${vendorId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Rapport personnalisé
```javascript
// KPIs d'un secteur sur une période spécifique
const report = await fetch(
  `/api/kpis/all?period=custom&startDate=2025-01-01T00:00:00.000Z&endDate=2025-03-31T23:59:59.999Z&sectorId=${sectorId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

## Swagger UI

Documentation interactive disponible sur: `http://localhost:3000/api-docs`

Tous les endpoints sont documentés avec:
- Schémas de réponse complets
- Exemples de requêtes
- Descriptions détaillées
- Paramètres requis/optionnels
