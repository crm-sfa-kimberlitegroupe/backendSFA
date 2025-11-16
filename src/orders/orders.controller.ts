import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum, OrderStatusEnum } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(RoleEnum.REP)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une vente',
    description:
      'Enregistre une vente avec validation du stock et mise à jour atomique du portefeuille',
  })
  @ApiResponse({
    status: 201,
    description: 'Vente créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuffisant ou données invalides',
  })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  @Get('my-orders')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Récupérer mes ventes',
    description: 'Liste toutes les ventes du vendeur connecté',
  })
  @ApiQuery({
    name: 'outletId',
    required: false,
    description: 'Filtrer par point de vente',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatusEnum,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Date de début (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Date de fin (ISO 8601)',
  })
  async getMyOrders(
    @Request() req,
    @Query('outletId') outletId?: string,
    @Query('status') status?: OrderStatusEnum,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      outletId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.ordersService.getVendorOrders(req.user.userId, filters);
  }

  @Get('my-stats')
  @Roles(RoleEnum.REP)
  @ApiOperation({
    summary: 'Statistiques de mes ventes',
    description: 'Récupère les statistiques de ventes du vendeur',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Période des statistiques',
  })
  async getMyStats(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.ordersService.getVendorSalesStats(req.user.userId, period);
  }

  @Get(':id')
  @Roles(RoleEnum.REP, RoleEnum.ADMIN, RoleEnum.SUP)
  @ApiOperation({
    summary: 'Récupérer une vente par ID',
    description: 'Détails complets d une vente',
  })
  async getOrderById(@Request() req, @Param('id') orderId: string) {
    // REP ne peut voir que ses propres ventes
    const userId = req.user.role === RoleEnum.REP ? req.user.userId : undefined;
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Get('vendor/:vendorId')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  @ApiOperation({
    summary: 'Récupérer les ventes d un vendeur',
    description: 'Liste toutes les ventes d un vendeur spécifique (ADMIN/SUP)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatusEnum,
    description: 'Filtrer par statut',
  })
  async getVendorOrders(
    @Param('vendorId') vendorId: string,
    @Query('status') status?: OrderStatusEnum,
  ) {
    const filters = status ? { status } : undefined;
    return this.ordersService.getVendorOrders(vendorId, filters);
  }

  @Get('vendor/:vendorId/stats')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  @ApiOperation({
    summary: 'Statistiques de ventes d un vendeur',
    description:
      'Récupère les statistiques d un vendeur spécifique (ADMIN/SUP)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Période des statistiques',
  })
  async getVendorStats(
    @Param('vendorId') vendorId: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.ordersService.getVendorSalesStats(vendorId, period);
  }
}
