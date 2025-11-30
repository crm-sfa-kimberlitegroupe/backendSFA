import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import {
  CreateVisitDto,
  CreateCompleteVisitDto,
  CompleteVisitDto,
  CheckInDto,
  CheckOutDto,
  CreateMerchCheckDto,
} from './dto/create-visit.dto';
import {
  UpdateVisitOrdersDto,
  UpdateVisitMerchandisingDto,
} from './dto/update-visit-orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * Créer une visite complète (check-in et check-out automatiques)
   * Utilisé quand le vendeur termine directement sa visite
   */
  @Post('complete')
  @Roles('REP')
  async createCompleteVisit(
    @Request() req: AuthenticatedRequest,
    @Body() createVisitDto: CreateCompleteVisitDto,
  ) {
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Visite créée avec succès',
      data: await this.visitsService.createCompleteVisit(
        req.user.userId,
        createVisitDto,
      ),
    };
  }

  /**
   * Check-in : Début d'une visite
   */
  @Post('check-in')
  @Roles('REP')
  async checkIn(
    @Request() req: AuthenticatedRequest,
    @Body() data: CheckInDto,
  ) {
    const visit = await this.visitsService.checkIn(req.user.userId, data);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Check-in effectué avec succès',
      data: visit,
    };
  }

  /**
   * Check-out : Fin d'une visite
   */
  @Post('check-out')
  @Roles('REP')
  async checkOut(
    @Request() req: AuthenticatedRequest,
    @Body() data: CheckOutDto,
  ) {
    const visit = await this.visitsService.checkOut(req.user.userId, data);
    return {
      statusCode: HttpStatus.OK,
      message: 'Check-out effectué avec succès',
      data: visit,
    };
  }

  /**
   * Terminer une visite avec toutes les données
   */
  @Put('complete')
  @Roles('REP')
  async completeVisit(
    @Request() req: AuthenticatedRequest,
    @Body() data: CompleteVisitDto,
  ) {
    const visit = await this.visitsService.completeVisit(req.user.userId, data);
    return {
      statusCode: HttpStatus.OK,
      message: 'Visite terminée avec succès',
      data: visit,
    };
  }

  /**
   * Récupérer les visites de l'utilisateur connecté
   */
  @Get('my-visits')
  @Roles('REP', 'ADMIN', 'SUP')
  async getMyVisits(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('outletId') outletId?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      outletId,
    };

    const visits = await this.visitsService.getUserVisits(
      req.user.userId,
      filters,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Visites récupérées avec succès',
      data: visits,
    };
  }

  /**
   * Récupérer la dernière visite d'un PDV (par outletId)
   */
  @Get('outlet/:outletId/latest')
  @Roles('REP', 'ADMIN', 'SUP')
  async getLatestVisitByOutlet(
    @Request() req: AuthenticatedRequest,
    @Param('outletId') outletId: string,
  ) {
    const visit = await this.visitsService.getLatestVisitByOutlet(outletId, req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Visite récupérée avec succès',
      data: visit,
    };
  }

  /**
   * Récupérer une visite par ID
   */
  @Get(':id')
  @Roles('REP', 'ADMIN', 'SUP')
  async getVisitById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const visit = await this.visitsService.getVisitById(id, req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Visite récupérée avec succès',
      data: visit,
    };
  }

  /**
   * Ajouter un merchandising à une visite
   */
  @Post(':id/merch-check')
  @Roles('REP')
  async addMerchCheck(
    @Request() req: AuthenticatedRequest,
    @Param('id') visitId: string,
    @Body() data: CreateMerchCheckDto,
  ) {
    const merchCheck = await this.visitsService.addMerchCheck(
      visitId,
      req.user.userId,
      data,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Merchandising ajouté avec succès',
      data: merchCheck,
    };
  }

  /**
   * Lier une vente à une visite
   */
  @Put(':visitId/link-order/:orderId')
  @Roles('REP')
  async linkOrderToVisit(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.visitsService.linkOrderToVisit(
      visitId,
      orderId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Vente liée à la visite avec succès',
      data: order,
    };
  }

  /**
   * Mettre à jour toutes les ventes d'une visite
   */
  @Put(':visitId/orders')
  @Roles('REP')
  async updateVisitOrders(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Body() data: UpdateVisitOrdersDto,
  ) {
    const visit = await this.visitsService.updateVisitOrders(
      visitId,
      data.orderIds,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Ventes de la visite mises à jour avec succès',
      data: visit,
    };
  }

  /**
   * Ajouter une vente à une visite
   */
  @Post(':visitId/orders/:orderId')
  @Roles('REP')
  async addOrderToVisit(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Param('orderId') orderId: string,
  ) {
    const visit = await this.visitsService.addOrderToVisit(
      visitId,
      orderId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Vente ajoutée à la visite avec succès',
      data: visit,
    };
  }

  /**
   * Supprimer une vente d'une visite
   */
  @Delete(':visitId/orders/:orderId')
  @Roles('REP')
  async removeOrderFromVisit(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Param('orderId') orderId: string,
  ) {
    const visit = await this.visitsService.removeOrderFromVisit(
      visitId,
      orderId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Vente supprimée de la visite avec succès',
      data: visit,
    };
  }

  /**
   * Mettre à jour tous les merchandising d'une visite
   */
  @Put(':visitId/merchandising')
  @Roles('REP')
  async updateVisitMerchandising(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Body() data: UpdateVisitMerchandisingDto,
  ) {
    const visit = await this.visitsService.updateVisitMerchandising(
      visitId,
      data.merchIds,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Merchandising de la visite mis à jour avec succès',
      data: visit,
    };
  }

  /**
   * Ajouter un merchandising à une visite
   */
  @Post(':visitId/merchandising/:merchId')
  @Roles('REP')
  async addMerchandisingToVisit(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Param('merchId') merchId: string,
  ) {
    const visit = await this.visitsService.addMerchandisingToVisit(
      visitId,
      merchId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Merchandising ajouté à la visite avec succès',
      data: visit,
    };
  }

  /**
   * Supprimer un merchandising d'une visite
   */
  @Delete(':visitId/merchandising/:merchId')
  @Roles('REP')
  async removeMerchandisingFromVisit(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Param('merchId') merchId: string,
  ) {
    const visit = await this.visitsService.removeMerchandisingFromVisit(
      visitId,
      merchId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Merchandising supprimé de la visite avec succès',
      data: visit,
    };
  }
}
