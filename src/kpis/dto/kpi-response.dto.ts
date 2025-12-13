import { ApiProperty } from '@nestjs/swagger';

export class KpiValueDto {
  @ApiProperty({ description: 'Valeur du KPI' })
  value: number;

  @ApiProperty({ description: 'Unité de mesure', example: 'FCFA' })
  unit: string;

  @ApiProperty({ description: 'Période de calcul' })
  period: string;

  @ApiProperty({ description: 'Date de début de la période' })
  startDate: Date;

  @ApiProperty({ description: 'Date de fin de la période' })
  endDate: Date;
}

export class ChiffresAffairesDto extends KpiValueDto {
  @ApiProperty({ description: 'Nombre de commandes' })
  orderCount: number;

  @ApiProperty({ description: 'Montant total HT' })
  totalHt: number;

  @ApiProperty({ description: 'Montant total TTC' })
  totalTtc: number;

  @ApiProperty({ description: 'Montant total TVA' })
  totalTax: number;
}

export class DropsizeDto extends KpiValueDto {
  @ApiProperty({ description: 'Nombre de commandes' })
  orderCount: number;

  @ApiProperty({ description: 'Montant total' })
  totalAmount: number;

  @ApiProperty({ description: 'Taille moyenne de commande' })
  averageOrderSize: number;
}

export class LpcDto extends KpiValueDto {
  @ApiProperty({ description: 'Nombre total de lignes' })
  totalLines: number;

  @ApiProperty({ description: 'Nombre de commandes' })
  orderCount: number;

  @ApiProperty({ description: 'Lignes par commande (moyenne)' })
  linesPerOrder: number;
}

export class TauxCouvertureDto extends KpiValueDto {
  @ApiProperty({ description: 'Nombre de clients cible' })
  targetClients: number;

  @ApiProperty({ description: 'Nombre de clients visités' })
  visitedClients: number;

  @ApiProperty({ description: 'Taux de couverture (%)' })
  coverageRate: number;
}

export class HitRateDto extends KpiValueDto {
  @ApiProperty({ description: 'Nombre total de visites' })
  totalVisits: number;

  @ApiProperty({ description: 'Nombre de visites avec vente' })
  visitsWithSale: number;

  @ApiProperty({ description: 'Taux de succès (%)' })
  hitRate: number;
}

export class FrequenceVisiteDto extends KpiValueDto {
  @ApiProperty({ description: 'Nombre total de visites' })
  totalVisits: number;

  @ApiProperty({ description: 'Nombre de clients uniques visités' })
  uniqueClients: number;

  @ApiProperty({ description: 'Fréquence moyenne de visite' })
  averageFrequency: number;
}

export class VenteParVisiteDto extends KpiValueDto {
  @ApiProperty({ description: 'Montant total des ventes' })
  totalSales: number;

  @ApiProperty({ description: 'Nombre de visites avec vente' })
  visitsWithSale: number;

  @ApiProperty({ description: 'Vente moyenne par visite' })
  averageSalePerVisit: number;
}

export class AllKpisDto {
  @ApiProperty({ type: ChiffresAffairesDto })
  chiffresAffaires: ChiffresAffairesDto;

  @ApiProperty({ type: DropsizeDto })
  dropsize: DropsizeDto;

  @ApiProperty({ type: LpcDto })
  lpc: LpcDto;

  @ApiProperty({ type: TauxCouvertureDto })
  tauxCouverture: TauxCouvertureDto;

  @ApiProperty({ type: HitRateDto })
  hitRate: HitRateDto;

  @ApiProperty({ type: FrequenceVisiteDto })
  frequenceVisite: FrequenceVisiteDto;

  @ApiProperty({ type: VenteParVisiteDto })
  venteParVisite: VenteParVisiteDto;
}

export class VendorPerformanceDto {
  @ApiProperty({ description: 'ID du vendeur' })
  id: string;

  @ApiProperty({ description: 'Nom du vendeur' })
  name: string;

  @ApiProperty({ description: 'Montant total des ventes' })
  sales: number;

  @ApiProperty({ description: 'Nombre de visites' })
  visits: number;

  @ApiProperty({ description: 'Rang (pour top performers)', required: false })
  rank?: number;
}

export class TeamPerformanceDto {
  @ApiProperty({ type: [VendorPerformanceDto], description: 'Top 3 vendeurs' })
  topPerformers: VendorPerformanceDto[];

  @ApiProperty({ type: [VendorPerformanceDto], description: 'Vendeurs à surveiller' })
  lowPerformers: VendorPerformanceDto[];
}
