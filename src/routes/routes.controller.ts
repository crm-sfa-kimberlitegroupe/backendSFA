import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum, RouteStatusEnum } from '@prisma/client';

@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  /**
   * GET /routes
   * Récupérer toutes les routes (ADMIN/SUP uniquement)
   */
  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async findAll(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
    @Query('status') status?: RouteStatusEnum,
  ) {
    return this.routesService.findAll({ userId, date, status });
  }

  /**
   * GET /routes/my-routes
   * Récupérer les routes de l'utilisateur connecté
   */
  @Get('my-routes')
  async findMyRoutes(
    @Request() req,
    @Query('date') date?: string,
    @Query('status') status?: RouteStatusEnum,
  ) {
    return this.routesService.findMyRoutes(req.user.sub, { date, status });
  }

  /**
   * GET /routes/:id
   * Récupérer une route par ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.routesService.findOne(id, req.user.sub, req.user.role);
  }

  /**
   * POST /routes
   * Créer une nouvelle route (ADMIN/SUP uniquement)
   */
  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  /**
   * PATCH /routes/:id
   * Mettre à jour une route
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateData: Partial<{ status: RouteStatusEnum; isOffRoute: boolean }>,
    @Request() req,
  ) {
    return this.routesService.update(
      id,
      updateData,
      req.user.sub,
      req.user.role,
    );
  }

  /**
   * PATCH /routes/:id/start
   * Démarrer une route
   */
  @Patch(':id/start')
  async start(@Param('id') id: string, @Request() req) {
    return this.routesService.start(id, req.user.sub, req.user.role);
  }

  /**
   * PATCH /routes/:id/complete
   * Terminer une route
   */
  @Patch(':id/complete')
  async complete(@Param('id') id: string, @Request() req) {
    return this.routesService.complete(id, req.user.sub, req.user.role);
  }

  /**
   * DELETE /routes/:id
   * Supprimer une route (ADMIN uniquement)
   */
  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    return this.routesService.remove(id, req.user.sub, req.user.role);
  }

  /**
   * GET /routes/vendor-outlets
   * Récupérer les PDV du secteur du vendeur connecté
   */
  @Get('vendor-outlets')
  @Roles(RoleEnum.REP)
  async getVendorSectorOutlets(@Request() req) {
    return this.routesService.getVendorSectorOutlets(req.user.sub);
  }
}
