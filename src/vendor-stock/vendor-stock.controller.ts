import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { VendorStockService, AddStockDto } from './vendor-stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('vendor-stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorStockController {
  constructor(private readonly vendorStockService: VendorStockService) {}

  /**
   * POST /vendor-stock/add
   * Ajouter du stock au portefeuille du vendeur
   * Accessible uniquement aux REP
   */
  @Post('add')
  @Roles(RoleEnum.REP)
  @HttpCode(HttpStatus.CREATED)
  async addStock(@Request() req: any, @Body() addStockDto: AddStockDto) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return this.vendorStockService.addStock(userId, userRole, addStockDto);
  }

  /**
   * GET /vendor-stock/my-portfolio
   * Récupérer le portefeuille stock du vendeur connecté
   * Accessible uniquement aux REP
   */
  @Get('my-portfolio')
  @Roles(RoleEnum.REP)
  async getMyPortfolio(@Request() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return this.vendorStockService.getMyPortfolio(userId, userRole);
  }

  /**
   * GET /vendor-stock/history
   * Récupérer l'historique des mouvements de stock
   * Accessible uniquement aux REP
   */
  @Get('history')
  @Roles(RoleEnum.REP)
  async getHistory(
    @Request() req: any,
    @Query('movementType') movementType?: string,
    @Query('skuId') skuId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const filters = {
      movementType,
      skuId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    return this.vendorStockService.getHistory(userId, userRole, filters);
  }

  /**
   * GET /vendor-stock/stock/:skuId
   * Récupérer le stock actuel d'un produit spécifique
   * Accessible uniquement aux REP
   */
  @Get('stock/:skuId')
  @Roles(RoleEnum.REP)
  async getStockForSku(@Request() req: any, @Query('skuId') skuId: string) {
    const userId = req.user.userId;
    return {
      skuId,
      quantity: await this.vendorStockService.getStockForSku(userId, skuId),
    };
  }

  /**
   * GET /vendor-stock/low-stock
   * Récupérer les produits avec stock faible
   * Accessible uniquement aux REP
   */
  @Get('low-stock')
  @Roles(RoleEnum.REP)
  async getLowStockItems(
    @Request() req: any,
    @Query('threshold') threshold?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const thresholdValue = threshold ? parseInt(threshold, 10) : 10;
    return this.vendorStockService.getLowStockItems(
      userId,
      userRole,
      thresholdValue,
    );
  }

  /**
   * GET /vendor-stock/stats
   * Récupérer les statistiques du portefeuille
   * Accessible uniquement aux REP
   */
  @Get('stats')
  @Roles(RoleEnum.REP)
  async getStats(@Request() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return this.vendorStockService.getStats(userId, userRole);
  }
}
