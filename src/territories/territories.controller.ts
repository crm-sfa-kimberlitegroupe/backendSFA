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
} from '@nestjs/common';
import { TerritoriesService } from './territories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';
import { CreateSectorDto } from './dto/create-sector.dto';
import { AssignOutletsToSectorDto } from './dto/assign-outlets-to-sector.dto';
import { AssignSectorToVendorDto } from './dto/assign-sector-to-vendor.dto';
import { AssignOutletsToVendorDto } from './dto/assign-outlets-to-vendor.dto';
import { RemoveOutletsFromSectorDto } from './dto/remove-outlets-from-sector.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';

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
   * POST /territories
   * Créer un nouveau territoire (ZONE)
   */
  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async createTerritory(@Body() data: any) {
    const territory = await this.territoriesService.createTerritory(data);
    return {
      success: true,
      data: territory,
      message: 'Territoire créé avec succès',
    };
  }

  /**
   * PUT /territories/:id
   * Mettre à jour un territoire
   */
  @Put(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async updateTerritory(@Param('id') id: string, @Body() data: any) {
    const territory = await this.territoriesService.updateTerritory(id, data);
    return {
      success: true,
      data: territory,
      message: 'Territoire mis à jour avec succès',
    };
  }

  /**
   * DELETE /territories/:id
   * Supprimer un territoire
   */
  @Delete(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async deleteTerritory(@Param('id') id: string) {
    await this.territoriesService.deleteTerritory(id);
    return {
      success: true,
      data: null,
      message: 'Territoire supprimé avec succès',
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

  /**
   * POST /territories/sectors/remove-outlets
   * Retirer des PDV d'un secteur (ADMIN uniquement)
   */
  @Post('sectors/remove-outlets')
  @Roles(RoleEnum.ADMIN)
  async removeOutletsFromSector(@Body() dto: RemoveOutletsFromSectorDto) {
    const result = await this.territoriesService.removeOutletsFromSector(dto);
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  /**
   * POST /territories/vendors/assign-outlets
   * Assigner des PDV directement à un vendeur (ADMIN uniquement)
   */
  @Post('vendors/assign-outlets')
  @Roles(RoleEnum.ADMIN)
  async assignOutletsToVendor(@Body() dto: AssignOutletsToVendorDto) {
    const result = await this.territoriesService.assignOutletsToVendor(dto);
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  /**
   * DELETE /territories/vendors/:vendorId/sector
   * Retirer un vendeur de son secteur (ADMIN uniquement)
   */
  @Delete('vendors/:vendorId/sector')
  @Roles(RoleEnum.ADMIN)
  async removeSectorFromVendor(@Param('vendorId') vendorId: string) {
    const result =
      await this.territoriesService.removeSectorFromVendor(vendorId);
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  /**
   * GET /territories/vendors/with-sectors
   * Récupérer tous les vendeurs avec leurs secteurs (ADMIN/SUP uniquement)
   */
  @Get('vendors/with-sectors')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async findAllVendorsWithSectors() {
    const vendors = await this.territoriesService.findAllVendorsWithSectors();
    return {
      success: true,
      data: vendors,
      message: 'Vendeurs avec secteurs récupérés avec succès',
    };
  }

  /**
   * GET /territories/:id/geo-info
   * Récupérer les informations géographiques d'un territoire (ADMIN/SUP uniquement)
   */
  @Get(':id/geo-info')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async getTerritoryGeoInfo(@Param('id') id: string) {
    const geoInfo = await this.territoriesService.getTerritoryGeoInfo(id);
    return {
      success: true,
      data: geoInfo,
      message: 'Informations géographiques récupérées avec succès',
    };
  }

  /**
   * GET /territories/admins/available
   * Récupérer la liste des administrateurs disponibles (SUP uniquement)
   */
  @Get('admins/available')
  @Roles(RoleEnum.SUP)
  async getAvailableAdmins(
    @Query('excludeTerritoryId')
    excludeTerritoryId?: string,
  ) {
    const admins =
      await this.territoriesService.getAvailableAdmins(excludeTerritoryId);
    return {
      success: true,
      data: admins,
      message: 'Administrateurs disponibles récupérés avec succès',
    };
  }

  /**
   * PATCH /territories/:id/assign-admin
   * Assigner un administrateur à un territoire (première assignation - SUP uniquement)
   */
  @Patch(':id/assign-admin')
  @Roles(RoleEnum.SUP)
  async assignAdmin(
    @Param('id') territoryId: string,
    @Body() dto: AssignAdminDto,
  ) {
    const territory = await this.territoriesService.assignTerritoryAdmin(
      territoryId,
      dto.adminId,
    );
    return {
      success: true,
      data: territory,
      message: 'Administrateur assigné au territoire avec succès',
    };
  }

  /**
   * PATCH /territories/:id/reassign-admin
   * Réassigner un administrateur à un territoire (changement - SUP uniquement)
   * Met à jour atomiquement le territoire et tous les vendeurs associés
   */
  @Patch(':id/reassign-admin')
  @Roles(RoleEnum.SUP)
  async reassignAdmin(
    @Param('id') territoryId: string,
    @Body() dto: AssignAdminDto,
  ) {
    const territory = await this.territoriesService.reassignTerritoryAdmin(
      territoryId,
      dto.adminId,
    );
    return {
      success: true,
      data: territory,
      message:
        'Administrateur réassigné avec succès. Les vendeurs ont été mis à jour.',
    };
  }

  /**
   * DELETE /territories/:id/remove-admin
   * Retirer l'administrateur d'un territoire (SUP uniquement)
   */
  @Delete(':id/remove-admin')
  @Roles(RoleEnum.SUP)
  async removeAdmin(@Param('id') territoryId: string) {
    const territory =
      await this.territoriesService.removeTerritoryAdmin(territoryId);
    return {
      success: true,
      data: territory,
      message: 'Administrateur retiré du territoire avec succès',
    };
  }

  /**
   * PATCH /territories/sectors/:id/reassign-vendor
   * Réassigner un vendeur à un secteur (changement - ADMIN uniquement)
   */
  @Patch('sectors/:id/reassign-vendor')
  @Roles(RoleEnum.ADMIN)
  async reassignSectorVendor(
    @Param('id') sectorId: string,
    @Body() dto: { vendorId: string },
  ) {
    const sector = await this.territoriesService.reassignSectorVendor(
      sectorId,
      dto.vendorId,
    );
    return {
      success: true,
      data: sector,
      message: 'Vendeur réassigné au secteur avec succès',
    };
  }

  /**
   * DELETE /territories/sectors/:id/unassign-vendor
   * Désassigner un vendeur d'un secteur (ADMIN uniquement)
   */
  @Delete('sectors/:id/unassign-vendor')
  @Roles('ADMIN', 'SUP')
  async unassignSectorVendor(@Param('id') sectorId: string) {
    return this.territoriesService.unassignSectorVendor(sectorId);
  }

  /**
   * GET /territories/vendors/:vendorId/assigned-sector
   * Récupérer le secteur assigné à un vendeur (ADMIN, SUP, REP uniquement)
   */
  @Get('vendors/:vendorId/assigned-sector')
  @Roles('ADMIN', 'SUP', 'REP')
  async getVendorAssignedSector(@Param('vendorId') vendorId: string) {
    return this.territoriesService.getVendorAssignedSector(vendorId);
  }
}
