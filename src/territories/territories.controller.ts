import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TerritoriesService } from './territories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';
import { CreateSectorDto } from './dto/create-sector.dto';
import { AssignOutletsToSectorDto } from './dto/assign-outlets-to-sector.dto';
import { AssignSectorToVendorDto } from './dto/assign-sector-to-vendor.dto';

@Controller('territories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  /**
   * GET /territories
   * Récupérer tous les territoires
   */
  @Get()
  async findAll() {
    const territories = await this.territoriesService.findAll();
    return {
      success: true,
      data: territories,
      message: 'Territoires récupérés avec succès',
    };
  }

  /**
   * POST /territories/sectors
   * Créer un nouveau secteur (ADMIN uniquement)
   */
  @Post('sectors')
  @Roles(RoleEnum.ADMIN)
  async createSector(@Body() createSectorDto: CreateSectorDto) {
    const sector = await this.territoriesService.createSector(createSectorDto);
    return {
      success: true,
      data: sector,
      message: 'Secteur créé avec succès',
    };
  }

  /**
   * GET /territories/sectors
   * Récupérer tous les secteurs avec leurs PDV et vendeurs
   */
  @Get('sectors')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async findAllSectors(@Query('level') level?: string) {
    const sectors = await this.territoriesService.findAllSectors({ level });
    return {
      success: true,
      data: sectors,
      message: 'Secteurs récupérés avec succès',
    };
  }

  /**
   * GET /territories/sectors/:id
   * Récupérer un secteur par ID
   */
  @Get('sectors/:id')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async findSectorById(@Param('id') id: string) {
    const sector = await this.territoriesService.findSectorById(id);
    return {
      success: true,
      data: sector,
      message: 'Secteur récupéré avec succès',
    };
  }

  /**
   * POST /territories/sectors/assign-outlets
   * Assigner des PDV à un secteur (ADMIN uniquement)
   */
  @Post('sectors/assign-outlets')
  @Roles(RoleEnum.ADMIN)
  async assignOutletsToSector(@Body() dto: AssignOutletsToSectorDto) {
    const sector = await this.territoriesService.assignOutletsToSector(dto);
    return {
      success: true,
      data: sector,
      message: 'PDV assignés au secteur avec succès',
    };
  }

  /**
   * POST /territories/sectors/assign-vendor
   * Assigner un secteur à un vendeur (ADMIN uniquement)
   */
  @Post('sectors/assign-vendor')
  @Roles(RoleEnum.ADMIN)
  async assignSectorToVendor(@Body() dto: AssignSectorToVendorDto) {
    const vendor = await this.territoriesService.assignSectorToVendor(dto);
    return {
      success: true,
      data: vendor,
      message: 'Secteur assigné au vendeur avec succès',
    };
  }

  /**
   * GET /territories/vendors/:vendorId/outlets
   * Récupérer les PDV d'un vendeur via son secteur
   */
  @Get('vendors/:vendorId/outlets')
  async getVendorOutlets(@Param('vendorId') vendorId: string) {
    const data = await this.territoriesService.getVendorOutlets(vendorId);
    return {
      success: true,
      data,
      message: 'PDV du vendeur récupérés avec succès',
    };
  }

  /**
   * DELETE /territories/sectors/:id
   * Supprimer un secteur (ADMIN uniquement)
   */
  @Delete('sectors/:id')
  @Roles(RoleEnum.ADMIN)
  async removeSector(@Param('id') id: string) {
    const result = await this.territoriesService.removeSector(id);
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }
}
