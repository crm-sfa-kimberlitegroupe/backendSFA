import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RouteStatusEnum, RouteStopStatusEnum, RoleEnum } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer toutes les routes avec filtres
   */
  async findAll(filters?: {
    userId?: string;
    date?: string;
    status?: RouteStatusEnum;
    sectorId?: string;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.date) {
      where.date = new Date(filters.date);
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtrer par secteur en récupérant les utilisateurs du secteur
    if (filters?.sectorId) {
      where.user = {
        assignedSectorId: filters.sectorId,
      };
    }

    return this.prisma.routePlan.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedSectorId: true,
            assignedSector: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        routeStops: {
          include: {
            outlet: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
                sectorId: true,
              },
            },
          },
          orderBy: {
            seq: 'asc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Récupérer les routes de l'utilisateur connecté
   */
  async findMyRoutes(
    userId: string,
    filters?: {
      date?: string;
      status?: RouteStatusEnum;
    },
  ) {
    return this.findAll({
      userId,
      ...filters,
    });
  }

  /**
   * Récupérer une route par ID
   */
  async findOne(id: string, userId?: string, userRole?: RoleEnum) {
    const route = await this.prisma.routePlan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        routeStops: {
          include: {
            outlet: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
              },
            },
          },
          orderBy: {
            seq: 'asc',
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`Route avec l'ID ${id} introuvable`);
    }

    // Vérifier les permissions (sauf pour ADMIN/SUP)
    if (userId && userRole === RoleEnum.REP && route.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas accéder à cette route');
    }

    return route;
  }

  /**
   * Créer une nouvelle route
   */
  async create(data: {
    userId: string;
    date: string;
    outletIds: string[];
  }) {
    const { userId, date, outletIds } = data;

    // Vérifier si une route existe déjà pour cet utilisateur à cette date
    const existing = await this.prisma.routePlan.findFirst({
      where: {
        userId,
        date: new Date(date),
      },
    });

    if (existing) {
      throw new ForbiddenException(
        'Une route existe déjà pour cet utilisateur à cette date',
      );
    }

    // Créer la route avec les arrêts
    return this.prisma.routePlan.create({
      data: {
        userId,
        date: new Date(date),
        status: RouteStatusEnum.PLANNED,
        routeStops: {
          create: outletIds.map((outletId, index) => ({
            outletId,
            seq: index + 1,
            status: RouteStopStatusEnum.PLANNED,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        routeStops: {
          include: {
            outlet: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
              },
            },
          },
          orderBy: {
            seq: 'asc',
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une route
   */
  async update(
    id: string,
    data: Partial<{
      status: RouteStatusEnum;
      isOffRoute: boolean;
    }>,
    userId?: string,
    userRole?: RoleEnum,
  ) {
    // Vérifier que la route existe et appartient à l'utilisateur
    const route = await this.findOne(id, userId, userRole);

    return this.prisma.routePlan.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        routeStops: {
          include: {
            outlet: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
              },
            },
          },
          orderBy: {
            seq: 'asc',
          },
        },
      },
    });
  }

  /**
   * Démarrer une route
   */
  async start(id: string, userId?: string, userRole?: RoleEnum) {
    return this.update(
      id,
      { status: RouteStatusEnum.IN_PROGRESS },
      userId,
      userRole,
    );
  }

  /**
   * Terminer une route
   */
  async complete(id: string, userId?: string, userRole?: RoleEnum) {
    return this.update(id, { status: RouteStatusEnum.DONE }, userId, userRole);
  }

  /**
   * Supprimer une route
   */
  async remove(id: string, userId?: string, userRole?: RoleEnum) {
    // Vérifier que la route existe et appartient à l'utilisateur
    await this.findOne(id, userId, userRole);

    await this.prisma.routePlan.delete({
      where: { id },
    });

    return { message: 'Route supprimée avec succès' };
  }

  /**
   * Mettre à jour le statut d'un arrêt
   */
  async updateRouteStop(
    routeStopId: string,
    data: {
      status?: RouteStopStatusEnum;
      reason?: string;
    },
  ) {
    return this.prisma.routeStop.update({
      where: { id: routeStopId },
      data,
    });
  }

  /**
   * Récupérer les PDV du secteur d'un vendeur pour créer une route
   */
  async getVendorSectorOutlets(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedSector: {
          include: {
            outletsSector: {
              where: {
                status: 'APPROVED', // Uniquement les PDV approuvés
              },
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable`);
    }

    if (!user.assignedSector) {
      throw new ForbiddenException(
        'Aucun secteur assigné à cet utilisateur',
      );
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      sector: {
        id: user.assignedSector.id,
        code: user.assignedSector.code,
        name: user.assignedSector.name,
      },
      outlets: user.assignedSector.outletsSector || [],
    };
  }
}
