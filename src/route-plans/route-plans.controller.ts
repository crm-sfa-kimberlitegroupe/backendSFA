import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';
import { RoutePlansService } from './route-plans.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('route-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutePlansController {
  constructor(private readonly routePlansService: RoutePlansService) {}

  /**
   * PATCH /route-plans/:routePlanId/stops/:outletId/status
   * Mettre à jour le statut d'un stop de route
   */
  @Patch(':routePlanId/stops/:outletId/status')
  @Roles(RoleEnum.REP, RoleEnum.ADMIN, RoleEnum.SUP)
  async updateRouteStopStatus(
    @Param('routePlanId') routePlanId: string,
    @Param('outletId') outletId: string,
    @Body() data: { status: 'PLANNED' | 'IN_PROGRESS' | 'VISITED' },
    @Request() req: AuthenticatedRequest,
  ) {
    const updatedStop = await this.routePlansService.updateRouteStopStatus(
      routePlanId,
      outletId,
      data.status,
      req.user.userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Statut du stop de route mis à jour avec succès',
      data: updatedStop,
    };
  }
}
