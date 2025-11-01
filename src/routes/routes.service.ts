import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
  async create(data: { userId: string; date: string; outletIds: string[]}) {
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
      throw new NotFoundException(
        `Utilisateur avec l'ID ${userId} introuvable`,
      );
    }

    if (!user.assignedSector) {
      throw new ForbiddenException('Aucun secteur assigné à cet utilisateur');
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

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Optimiser l'ordre des PDV avec l'algorithme du plus proche voisin
   */
  private nearestNeighborOptimization(outlets: any[]): string[] {
    if (outlets.length <= 1) {
      return outlets.map((o) => o.id);
    }

    // Filtrer les outlets qui ont des coordonnées
    const validOutlets = outlets.filter((o) => o.lat && o.lng);
    if (validOutlets.length === 0) {
      return outlets.map((o) => o.id);
    }

    const visited = new Set<string>();
    const orderedIds: string[] = [];

    // Commencer par le premier PDV
    let current = validOutlets[0];
    visited.add(current.id);
    orderedIds.push(current.id);

    // Trouver le plus proche voisin non visité
    while (visited.size < validOutlets.length) {
      let nearestOutlet: any = null;
      let minDistance = Infinity;

      for (const outlet of validOutlets) {
        if (!visited.has(outlet.id)) {
          const distance = this.calculateDistance(
            Number(current.lat),
            Number(current.lng),
            Number(outlet.lat),
            Number(outlet.lng),
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestOutlet = outlet;
          }
        }
      }

      if (nearestOutlet) {
        visited.add(nearestOutlet.id);
        orderedIds.push(nearestOutlet.id);
        current = nearestOutlet;
      } else {
        break;
      }
    }

    // Ajouter les outlets sans coordonnées à la fin
    const outletsWithoutCoords = outlets.filter((o) => !o.lat || !o.lng);
    orderedIds.push(...outletsWithoutCoords.map((o) => o.id));

    return orderedIds;
  }

  /**
   * Algorithme 2-opt pour améliorer une route existante
   * Échange des segments pour réduire les croisements et la distance totale
   */
  private twoOptOptimization(outlets: any[], initialOrder: string[]): string[] {
    if (outlets.length < 4) {
      return initialOrder;
    }

    const outletMap = new Map(outlets.map(o => [o.id, o]));
    let route = [...initialOrder];
    let improved = true;
    let maxIterations = 100;
    let iteration = 0;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length - 1; j++) {
          const outlet1 = outletMap.get(route[i]);
          const outlet2 = outletMap.get(route[i + 1]);
          const outlet3 = outletMap.get(route[j]);
          const outlet4 = outletMap.get(route[j + 1]);

          if (!outlet1?.lat || !outlet2?.lat || !outlet3?.lat || !outlet4?.lat) {
            continue;
          }

          // Distance actuelle
          const currentDist =
            this.calculateDistance(
              Number(outlet1.lat),
              Number(outlet1.lng),
              Number(outlet2.lat),
              Number(outlet2.lng),
            ) +
            this.calculateDistance(
              Number(outlet3.lat),
              Number(outlet3.lng),
              Number(outlet4.lat),
              Number(outlet4.lng),
            );

          // Distance après échange
          const newDist =
            this.calculateDistance(
              Number(outlet1.lat),
              Number(outlet1.lng),
              Number(outlet3.lat),
              Number(outlet3.lng),
            ) +
            this.calculateDistance(
              Number(outlet2.lat),
              Number(outlet2.lng),
              Number(outlet4.lat),
              Number(outlet4.lng),
            );

          // Si l'échange améliore, on l'applique
          if (newDist < currentDist) {
            // Inverser le segment entre i+1 et j
            const newRoute = [
              ...route.slice(0, i + 1),
              ...route.slice(i + 1, j + 1).reverse(),
              ...route.slice(j + 1),
            ];
            route = newRoute;
            improved = true;
          }
        }
      }
    }

    return route;
  }

  /**
   * Calculer la distance totale d'une route
   */
  private calculateTotalDistance(outlets: any[], order: string[]): number {
    const outletMap = new Map(outlets.map(o => [o.id, o]));
    let totalDistance = 0;

    for (let i = 0; i < order.length - 1; i++) {
      const outlet1 = outletMap.get(order[i]);
      const outlet2 = outletMap.get(order[i + 1]);

      if (outlet1?.lat && outlet1?.lng && outlet2?.lat && outlet2?.lng) {
        totalDistance += this.calculateDistance(
          Number(outlet1.lat),
          Number(outlet1.lng),
          Number(outlet2.lat),
          Number(outlet2.lng),
        );
      }
    }

    return totalDistance;
  }

  /**
   * Estimer le temps total (déplacement + temps par PDV)
   * @param distance Distance en km
   * @param nbOutlets Nombre de PDV
   * @param avgSpeed Vitesse moyenne en km/h (défaut: 30 km/h en ville)
   * @param avgTimePerOutlet Temps moyen par PDV en minutes (défaut: 20 min)
   */
  private estimateTotalTime(
    distance: number,
    nbOutlets: number,
    avgSpeed: number = 30,
    avgTimePerOutlet: number = 20,
  ): number {
    const travelTimeHours = distance / avgSpeed;
    const travelTimeMinutes = travelTimeHours * 60;
    const outletTimeMinutes = nbOutlets * avgTimePerOutlet;
    return Math.round(travelTimeMinutes + outletTimeMinutes);
  }

  /**
   * Optimiser l'ordre des PDV avec algorithmes combinés
   */
  private optimizeOutletOrder(
    outlets: any[],
    useAdvancedOptimization: boolean = true,
  ): { order: string[]; distance: number; estimatedTime: number } {
    if (outlets.length <= 1) {
      return {
        order: outlets.map((o) => o.id),
        distance: 0,
        estimatedTime: outlets.length * 20,
      };
    }

    // Phase 1: Plus proche voisin
    let order = this.nearestNeighborOptimization(outlets);

    // Phase 2: 2-opt si demandé
    if (useAdvancedOptimization && outlets.length >= 4) {
      order = this.twoOptOptimization(outlets, order);
    }

    // Calculer les métriques
    const distance = this.calculateTotalDistance(outlets, order);
    const estimatedTime = this.estimateTotalTime(distance, outlets.length);

    return { order, distance, estimatedTime };
  }

  /**
   * Générer une route automatiquement avec optimisation
   */
  async generateRoute(data: {
    userId: string;
    date: string;
    outletIds?: string[];
    optimize?: boolean;
    maxOutlets?: number;
    maxDistance?: number;
  }) {
    const { userId, date, outletIds, optimize = true, maxOutlets, maxDistance } = data;

    // Récupérer l'utilisateur et son secteur
    const vendorData = await this.getVendorSectorOutlets(userId);

    let selectedOutlets = vendorData.outlets;

    // Si des IDs spécifiques sont fournis, filtrer
    if (outletIds && outletIds.length > 0) {
      selectedOutlets = selectedOutlets.filter((o) => outletIds.includes(o.id));
    }

    if (selectedOutlets.length === 0) {
      throw new ForbiddenException('Aucun point de vente disponible');
    }

    // Limiter le nombre de PDV si maxOutlets est défini
    if (maxOutlets && selectedOutlets.length > maxOutlets) {
      selectedOutlets = selectedOutlets.slice(0, maxOutlets);
    }

    // Optimiser l'ordre si demandé
    let orderedOutletIds: string[];
    let routeDistance = 0;
    let estimatedTime = 0;

    if (optimize) {
      const optimizationResult = this.optimizeOutletOrder(selectedOutlets, true);
      orderedOutletIds = optimizationResult.order;
      routeDistance = optimizationResult.distance;
      estimatedTime = optimizationResult.estimatedTime;

      // Vérifier la contrainte de distance maximale
      if (maxDistance && routeDistance > maxDistance) {
        throw new ForbiddenException(
          `La distance totale (${routeDistance.toFixed(1)} km) dépasse la limite autorisée (${maxDistance} km)`,
        );
      }
    } else {
      orderedOutletIds = selectedOutlets.map((o) => o.id);
    }

    // Créer la route avec métadonnées
    const route = await this.create({
      userId,
      date,
      outletIds: orderedOutletIds,
    });

    // Retourner avec les métriques
    return {
      ...route,
      metrics: {
        totalDistance: routeDistance,
        estimatedTime,
        numberOfOutlets: orderedOutletIds.length,
      },
    };
  }

  /**
   * Générer des routes pour plusieurs jours
   */
  async generateMultiDayRoutes(data: {
    userId: string;
    startDate: string;
    numberOfDays: number;
    outletsPerDay?: number;
    optimize?: boolean;
  }) {
    const { userId, startDate, numberOfDays, outletsPerDay = 8, optimize = true } = data;

    // Récupérer tous les outlets du secteur
    const vendorData = await this.getVendorSectorOutlets(userId);
    const allOutlets = vendorData.outlets;

    if (allOutlets.length === 0) {
      throw new ForbiddenException('Aucun point de vente disponible');
    }

    const routes = [];
    const start = new Date(startDate);

    // Distribuer les outlets sur plusieurs jours
    for (let day = 0; day < numberOfDays; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Vérifier si une route existe déjà
      const existing = await this.prisma.routePlan.findFirst({
        where: {
          userId,
          date: currentDate,
        },
      });

      if (existing) {
        continue; // Passer si une route existe déjà
      }

      // Sélectionner les outlets pour ce jour
      const startIdx = day * outletsPerDay;
      const endIdx = Math.min(startIdx + outletsPerDay, allOutlets.length);
      const dayOutlets = allOutlets.slice(startIdx, endIdx);

      if (dayOutlets.length === 0) {
        break; // Plus d'outlets à assigner
      }

      // Générer la route pour ce jour
      const route = await this.generateRoute({
        userId,
        date: dateStr,
        outletIds: dayOutlets.map(o => o.id),
        optimize,
      });

      routes.push(route);
    }

    return {
      routes,
      summary: {
        totalRoutes: routes.length,
        totalOutlets: routes.reduce((sum, r) => sum + (r.metrics?.numberOfOutlets || 0), 0),
        totalDistance: routes.reduce((sum, r) => sum + (r.metrics?.totalDistance || 0), 0),
        totalEstimatedTime: routes.reduce((sum, r) => sum + (r.metrics?.estimatedTime || 0), 0),
      },
    };
  }

  /**
   * Obtenir les métriques d'une route existante
   */
  async getRouteMetrics(routeId: string) {
    const route = await this.prisma.routePlan.findUnique({
      where: { id: routeId },
      include: {
        routeStops: {
          include: {
            outlet: {
              select: {
                id: true,
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
      throw new NotFoundException('Route introuvable');
    }

    const outlets = route.routeStops
      .map(stop => stop.outlet)
      .filter(o => o.lat && o.lng);

    const order = route.routeStops.map(stop => stop.outletId);
    const distance = this.calculateTotalDistance(outlets, order);
    const estimatedTime = this.estimateTotalTime(distance, route.routeStops.length);

    return {
      routeId: route.id,
      totalDistance: distance,
      estimatedTime,
      numberOfOutlets: route.routeStops.length,
      numberOfVisited: route.routeStops.filter(s => s.status === 'VISITED').length,
    };
  }
}
