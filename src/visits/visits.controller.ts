import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
}
