import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KpisService } from './kpis.service';
import { KpiQueryDto } from './dto/kpi-query.dto';
import {
  ChiffresAffairesDto,
  DropsizeDto,
  LpcDto,
  TauxCouvertureDto,
  HitRateDto,
  FrequenceVisiteDto,
  VenteParVisiteDto,
  AllKpisDto,
} from './dto/kpi-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';

@ApiTags('KPIs')
@Controller('kpis')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get('chiffres-affaires')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'Chiffre d Affaires (CA)',
    description: 'Mesure la performance globale des ventes sur une période',
  })
  @ApiResponse({ status: 200, type: ChiffresAffairesDto })
  async getChiffresAffaires(
    @Query() query: KpiQueryDto,
  ): Promise<ChiffresAffairesDto> {
    return this.kpisService.getChiffresAffaires(query);
  }

  @Get('dropsize')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'Dropsize (Taille de Commande)',
    description:
      'Évalue l efficacité de la vente additionnelle et du panier moyen',
  })
  @ApiResponse({ status: 200, type: DropsizeDto })
  async getDropsize(@Query() query: KpiQueryDto): Promise<DropsizeDto> {
    return this.kpisService.getDropsize(query);
  }

  @Get('lpc')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'LPC (Lignes Par Commande)',
    description:
      'Mesure la diversité des produits achetés lors d une transaction',
  })
  @ApiResponse({ status: 200, type: LpcDto })
  async getLpc(@Query() query: KpiQueryDto): Promise<LpcDto> {
    return this.kpisService.getLpc(query);
  }

  @Get('taux-couverture')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'Taux de Couverture Client',
    description: 'Mesure l atteinte du portefeuille client cible',
  })
  @ApiResponse({ status: 200, type: TauxCouvertureDto })
  async getTauxCouverture(
    @Query() query: KpiQueryDto,
  ): Promise<TauxCouvertureDto> {
    return this.kpisService.getTauxCouverture(query);
  }

  @Get('hit-rate')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'Taux de Succès des Visites (Hit Rate)',
    description: 'Mesure l efficacité de la visite à générer une transaction',
  })
  @ApiResponse({ status: 200, type: HitRateDto })
  async getHitRate(@Query() query: KpiQueryDto): Promise<HitRateDto> {
    return this.kpisService.getHitRate(query);
  }

  @Get('frequence-visite')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'Fréquence Moyenne de Visite',
    description: 'Assure une présence régulière et optimale chez les clients',
  })
  @ApiResponse({ status: 200, type: FrequenceVisiteDto })
  async getFrequenceVisite(
    @Query() query: KpiQueryDto,
  ): Promise<FrequenceVisiteDto> {
    return this.kpisService.getFrequenceVisite(query);
  }

  @Get('vente-par-visite')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  @ApiOperation({
    summary: 'Vente Moyenne Par Visite',
    description: 'Mesure la valeur générée par chaque interaction commerciale',
  })
  @ApiResponse({ status: 200, type: VenteParVisiteDto })
  async getVenteParVisite(
    @Query() query: KpiQueryDto,
  ): Promise<VenteParVisiteDto> {
    return this.kpisService.getVenteParVisite(query);
  }

  @Get('all')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  @ApiOperation({
    summary: 'Tous les KPIs',
    description:
      'Récupère tous les KPIs en une seule requête (ADMIN/SUP uniquement)',
  })
  @ApiResponse({ status: 200, type: AllKpisDto })
  async getAllKpis(@Query() query: KpiQueryDto): Promise<AllKpisDto> {
    return this.kpisService.getAllKpis(query);
  }
}
