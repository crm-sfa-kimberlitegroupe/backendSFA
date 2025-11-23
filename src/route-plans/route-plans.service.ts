import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RouteStopStatusEnum } from '@prisma/client';

@Injectable()
export class RoutePlansService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mettre à jour le statut d'un stop de route
   */
  async updateRouteStopStatus(
    routePlanId: string,
    outletId: string,
    status: 'PLANNED' | 'IN_PROGRESS' | 'VISITED',
    userId: string,
  ) {
    // Vérifier que la route existe et appartient à l'utilisateur
    const routePlan = await this.prisma.routePlan.findFirst({
      where: {
        id: routePlanId,
        userId,
      },
      include: {
        routeStops: true,
      },
    });

    if (!routePlan) {
      throw new NotFoundException(
        `Route ${routePlanId} introuvable ou non autorisée`,
      );
    }

    // Vérifier que le stop existe dans cette route
    const routeStop = routePlan.routeStops.find(
      (stop) => stop.outletId === outletId,
    );

    if (!routeStop) {
      throw new NotFoundException(
        `Stop ${outletId} introuvable dans la route ${routePlanId}`,
      );
    }

    // Mapper le statut frontend vers le statut backend
    let dbStatus: RouteStopStatusEnum;
    if (status === 'VISITED') {
      dbStatus = RouteStopStatusEnum.VISITED;
    } else if (status === 'IN_PROGRESS') {
      dbStatus = RouteStopStatusEnum.IN_PROGRESS;
    } else {
      // PLANNED
      dbStatus = RouteStopStatusEnum.PLANNED;
    }

    // Mettre à jour le statut du stop
    const updatedStop = await this.prisma.routeStop.update({
      where: {
        id: routeStop.id,
      },
      data: {
        status: dbStatus,
      },
      include: {
        outlet: true,
      },
    });

    return updatedStop;
  }
}
