export interface UserPerformanceDto {
  coverage: number; // Taux de couverture (%)
  strikeRate: number; // Strike Rate (%)
  visitsThisMonth: number; // Nombre de visites ce mois
  salesThisMonth: number; // CA généré ce mois (FCFA)
  perfectStoreScore: number; // Score Perfect Store (%)
  totalOutlets: number; // Nombre total de PDV dans le territoire
  visitedOutlets: number; // Nombre de PDV visités ce mois
  ordersThisMonth: number; // Nombre de commandes ce mois
  averageOrderValue: number; // Valeur moyenne des commandes
}
