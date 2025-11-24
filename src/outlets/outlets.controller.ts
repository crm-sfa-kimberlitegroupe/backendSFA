import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OutletStatusEnum } from '@prisma/client';

interface RequestWithUser {
  user?: {
    userId?: string;
    role?: string;
    territoryId?: string;
  };
}

@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  create(
    @Body() createOutletDto: CreateOutletDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    return this.outletsService.create(createOutletDto, userId);
  }

  @Get()
  async findAll(
    @Query('status') status?: OutletStatusEnum,
    @Query('territoryId') territoryId?: string,
    @Query('channel') channel?: string,
    @Query('proposedBy') proposedBy?: string,
    @Request() req?: RequestWithUser,
  ) {
    const userRole = req?.user?.role;
    const userTerritoryId = req?.user?.territoryId;

    // 🔒 FILTRAGE PAR TERRITOIRE selon le rôle
    // ADMIN/SUP : Voient SEULEMENT les PDV de LEUR territoire
    let finalTerritoryId = territoryId;

    if (userRole === 'ADMIN' || userRole === 'SUP') {
      if (userTerritoryId) {
        finalTerritoryId = userTerritoryId;
      }
    }

    return this.outletsService.findAll({
      status,
      territoryId: finalTerritoryId,
      channel,
      proposedBy,
    });
  }

  @Get('stats')
  getStats(
    @Query('territoryId') territoryId?: string,
    @Query('proposedBy') proposedBy?: string,
  ) {
    return this.outletsService.getStats({ territoryId, proposedBy });
  }

  /**
   * 🔒 NOUVEL ENDPOINT DÉDIÉ : Récupérer les PDV de MON territoire
   * Route: GET /outlets/my-territory?status=APPROVED
   */
  @Get('my-territory')
  @Roles('ADMIN', 'SUP')
  async getMyTerritoryOutlets(
    @Query('status') status?: OutletStatusEnum,
    @Query('channel') channel?: string,
    @Request() req?: RequestWithUser,
  ) {
    const userTerritoryId = req?.user?.territoryId;

    if (!userTerritoryId) {
      console.error('❌ Pas de territoryId dans le JWT');
      throw new ForbiddenException(
        'Aucun territoire assigné à cet utilisateur',
      );
    }

    // 🎯 Forcer le territoryId de l'utilisateur connecté
    const filters = {
      status,
      territoryId: userTerritoryId, // ← FORCÉ
      channel,
    };

    const result = await this.outletsService.findAll(filters);
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outletsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOutletDto: UpdateOutletDto) {
    return this.outletsService.update(id, updateOutletDto);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'SUP')
  async approve(@Param('id') id: string, @Request() req: RequestWithUser) {
    const validatorId = req.user?.userId;
    const userTerritoryId = req.user?.territoryId;

    // 🔒 VÉRIFICATION : L'ADMIN peut valider SEULEMENT les PDV de SON territoire
    if (userTerritoryId) {
      const outlet = await this.outletsService.findOne(id);
      if (outlet.territoryId !== userTerritoryId) {
        throw new ForbiddenException(
          'Vous ne pouvez valider que les PDV de votre territoire',
        );
      }
    }

    return this.outletsService.approve(id, validatorId);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'SUP')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Request() req?: RequestWithUser,
  ) {
    const validatorId = req?.user?.userId;
    const userTerritoryId = req?.user?.territoryId;

    // 🔒 VÉRIFICATION : L'ADMIN peut rejeter SEULEMENT les PDV de SON territoire
    if (userTerritoryId) {
      const outlet = await this.outletsService.findOne(id);
      if (outlet.territoryId !== userTerritoryId) {
        throw new ForbiddenException(
          'Vous ne pouvez rejeter que les PDV de votre territoire',
        );
      }
    }

    return this.outletsService.reject(id, reason, validatorId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.outletsService.remove(id);
  }
}
