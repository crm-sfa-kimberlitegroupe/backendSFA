import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VendorStockService } from './vendor-stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Vendor Stock')
@Controller('vendor-stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VendorStockController {
  constructor(private readonly vendorStockService: VendorStockService) {}

  @Get('my-stock')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Récupérer mon stock',
    description:
      'Récupère le stock complet du vendeur connecté avec les informations des SKUs',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock récupéré avec succès',
  })
  async getMyStock(@Request() req: AuthenticatedRequest) {
    return this.vendorStockService.getVendorStock(req.user.userId);
  }

  @Get('stats')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Statistiques de mon stock',
    description: 'Récupère les statistiques du stock du vendeur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  async getStats(@Request() req: AuthenticatedRequest) {
    return this.vendorStockService.getVendorStockStats(req.user.userId);
  }

  @Post('add')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Ajouter du stock',
    description: 'Ajoute du stock au portefeuille du vendeur',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock ajouté avec succès',
  })
  async addStock(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: { items: Array<{ skuId: string; quantity: number }>; notes?: string },
  ) {
    return this.vendorStockService.addStock(
      req.user.userId,
      body.items,
      body.notes,
    );
  }

  @Get('my-portfolio')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Mon portefeuille',
    description: 'Récupère le portefeuille complet du vendeur',
  })
  @ApiResponse({
    status: 200,
    description: 'Portefeuille récupéré avec succès',
  })
  async getMyPortfolio(@Request() req: AuthenticatedRequest) {
    return this.vendorStockService.getMyPortfolio(req.user.userId);
  }

  @Get('low-stock')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Produits avec stock faible',
    description: 'Récupère les produits avec un stock faible',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits récupérés avec succès',
  })
  async getLowStockItems(
    @Request() req: AuthenticatedRequest,
    @Query('threshold') threshold?: number,
  ) {
    return this.vendorStockService.getLowStockItems(
      req.user.userId,
      threshold || 10,
    );
  }

  @Get('history')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Historique des mouvements',
    description: 'Récupère l historique des mouvements de stock',
  })
  @ApiResponse({
    status: 200,
    description: 'Historique récupéré avec succès',
  })
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Query('movementType')
    movementType?: 'ADD' | 'REMOVE' | 'SALE' | 'ADJUSTMENT',
    @Query('skuId') skuId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    const filters: {
      movementType?: 'ADD' | 'REMOVE' | 'SALE' | 'ADJUSTMENT';
      skuId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {};

    if (movementType) filters.movementType = movementType;
    if (skuId) filters.skuId = skuId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = Number(limit);

    return this.vendorStockService.getHistory(req.user.userId, filters);
  }

  @Delete('remove/:skuId')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Supprimer un produit du stock',
    description: 'Supprime un produit specifique du portefeuille du vendeur',
  })
  @ApiResponse({
    status: 200,
    description: 'Produit supprime avec succes',
  })
  async removeProduct(
    @Request() req: AuthenticatedRequest,
    @Param('skuId') skuId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.vendorStockService.removeProduct(
      req.user.userId,
      skuId,
      body?.notes,
    );
  }

  @Post('remove-multiple')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Supprimer plusieurs produits du stock',
    description: 'Supprime plusieurs produits du portefeuille du vendeur en une seule operation',
  })
  @ApiResponse({
    status: 200,
    description: 'Produits supprimes avec succes',
  })
  async removeMultipleProducts(
    @Request() req: AuthenticatedRequest,
    @Body() body: { skuIds: string[]; notes?: string },
  ) {
    return this.vendorStockService.removeMultipleProducts(
      req.user.userId,
      body.skuIds,
      body.notes,
    );
  }

  @Delete('unload-all')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Decharger tout le stock',
    description: 'Vide completement le portefeuille du vendeur. Cette action est irreversible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock decharge avec succes',
  })
  async unloadAllStock(
    @Request() req: AuthenticatedRequest,
    @Body() body?: { notes?: string },
  ) {
    return this.vendorStockService.unloadAllStock(req.user.userId, body?.notes);
  }
}
