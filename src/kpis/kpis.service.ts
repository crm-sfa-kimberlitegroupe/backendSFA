import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KpiQueryDto, PeriodEnum } from './dto/kpi-query.dto';
import {
  ChiffresAffairesDto,
  DropsizeDto,
  LpcDto,
  TauxCouvertureDto,
  HitRateDto,
  FrequenceVisiteDto,
  VenteParVisiteDto,
  AllKpisDto,
  TeamPerformanceDto,
  VendorPerformanceDto,
} from './dto/kpi-response.dto';

@Injectable()
export class KpisService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(query: KpiQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (query.period === PeriodEnum.CUSTOM) {
      if (!query.startDate || !query.endDate) {
        throw new Error('startDate et endDate sont requis pour period=custom');
      }
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.period) {
        case PeriodEnum.DAY:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case PeriodEnum.WEEK:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case PeriodEnum.MONTH:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case PeriodEnum.QUARTER:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          startDate.setHours(0, 0, 0, 0);
          break;
        case PeriodEnum.YEAR:
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    return { startDate, endDate };
  }

  private buildWhereClause(
    query: KpiQueryDto,
    dateRange: { startDate: Date; endDate: Date },
  ) {
    const where: any = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (query.vendorId) {
      where.userId = query.vendorId;
    }

    if (query.sectorId) {
      where.user = {
        assignedSectorId: query.sectorId,
      };
    }

    if (query.territoryId) {
      where.user = {
        territoryId: query.territoryId,
      };
    }

    return where;
  }

  async getChiffresAffaires(query: KpiQueryDto): Promise<ChiffresAffairesDto> {
    const dateRange = this.getDateRange(query);
    const where = this.buildWhereClause(query, dateRange);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        totalHt: true,
        totalTtc: true,
        taxTotal: true,
      },
    });

    const totalHt = orders.reduce(
      (sum, order) => sum + Number(order.totalHt),
      0,
    );
    const totalTtc = orders.reduce(
      (sum, order) => sum + Number(order.totalTtc),
      0,
    );
    const totalTax = orders.reduce(
      (sum, order) => sum + Number(order.taxTotal),
      0,
    );

    return {
      value: totalTtc,
      unit: 'FCFA',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      orderCount: orders.length,
      totalHt,
      totalTtc,
      totalTax,
    };
  }

  async getDropsize(query: KpiQueryDto): Promise<DropsizeDto> {
    const dateRange = this.getDateRange(query);
    const where = this.buildWhereClause(query, dateRange);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        totalTtc: true,
      },
    });

    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalTtc),
      0,
    );
    const orderCount = orders.length;
    const averageOrderSize = orderCount > 0 ? totalAmount / orderCount : 0;

    return {
      value: averageOrderSize,
      unit: 'FCFA',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      orderCount,
      totalAmount,
      averageOrderSize,
    };
  }

  async getLpc(query: KpiQueryDto): Promise<LpcDto> {
    const dateRange = this.getDateRange(query);
    const where = this.buildWhereClause(query, dateRange);

    const [orderCount, totalLines] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.orderLine.count({
        where: {
          order: where,
        },
      }),
    ]);

    const linesPerOrder = orderCount > 0 ? totalLines / orderCount : 0;

    return {
      value: linesPerOrder,
      unit: 'lignes',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      totalLines,
      orderCount,
      linesPerOrder,
    };
  }

  async getTauxCouverture(query: KpiQueryDto): Promise<TauxCouvertureDto> {
    const dateRange = this.getDateRange(query);

    const visitWhere: any = {
      checkinAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (query.vendorId) {
      visitWhere.userId = query.vendorId;
    }

    if (query.sectorId) {
      visitWhere.user = {
        assignedSectorId: query.sectorId,
      };
    }

    if (query.territoryId) {
      visitWhere.user = {
        territoryId: query.territoryId,
      };
    }

    const outletWhere: any = {};
    if (query.sectorId) {
      outletWhere.sectorId = query.sectorId;
    }
    if (query.territoryId) {
      outletWhere.territoryId = query.territoryId;
    }

    const [visitedClients, targetClients] = await Promise.all([
      this.prisma.visit.findMany({
        where: visitWhere,
        select: { outletId: true },
        distinct: ['outletId'],
      }),
      this.prisma.outlet.count({
        where: {
          ...outletWhere,
          status: 'APPROVED',
        },
      }),
    ]);

    const visitedCount = visitedClients.length;
    const coverageRate = targetClients > 0 ? (visitedCount / targetClients) * 100 : 0;

    return {
      value: coverageRate,
      unit: '%',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      targetClients,
      visitedClients: visitedCount,
      coverageRate,
    };
  }

  async getHitRate(query: KpiQueryDto): Promise<HitRateDto> {
    const dateRange = this.getDateRange(query);

    const visitWhere: any = {
      checkinAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (query.vendorId) {
      visitWhere.userId = query.vendorId;
    }

    if (query.sectorId) {
      visitWhere.user = {
        assignedSectorId: query.sectorId,
      };
    }

    if (query.territoryId) {
      visitWhere.user = {
        territoryId: query.territoryId,
      };
    }

    const [totalVisits, visitsWithSale] = await Promise.all([
      this.prisma.visit.count({ where: visitWhere }),
      this.prisma.visit.count({
        where: {
          ...visitWhere,
          orders: {
            some: {},
          },
        },
      }),
    ]);

    const hitRate = totalVisits > 0 ? (visitsWithSale / totalVisits) * 100 : 0;

    return {
      value: hitRate,
      unit: '%',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      totalVisits,
      visitsWithSale,
      hitRate,
    };
  }

  async getFrequenceVisite(query: KpiQueryDto): Promise<FrequenceVisiteDto> {
    const dateRange = this.getDateRange(query);

    const visitWhere: any = {
      checkinAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (query.vendorId) {
      visitWhere.userId = query.vendorId;
    }

    if (query.sectorId) {
      visitWhere.user = {
        assignedSectorId: query.sectorId,
      };
    }

    if (query.territoryId) {
      visitWhere.user = {
        territoryId: query.territoryId,
      };
    }

    const [totalVisits, uniqueClients] = await Promise.all([
      this.prisma.visit.count({ where: visitWhere }),
      this.prisma.visit.findMany({
        where: visitWhere,
        select: { outletId: true },
        distinct: ['outletId'],
      }),
    ]);

    const uniqueCount = uniqueClients.length;
    const averageFrequency = uniqueCount > 0 ? totalVisits / uniqueCount : 0;

    return {
      value: averageFrequency,
      unit: 'visites',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      totalVisits,
      uniqueClients: uniqueCount,
      averageFrequency,
    };
  }

  async getVenteParVisite(query: KpiQueryDto): Promise<VenteParVisiteDto> {
    const dateRange = this.getDateRange(query);

    const visitWhere: any = {
      checkinAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (query.vendorId) {
      visitWhere.userId = query.vendorId;
    }

    if (query.sectorId) {
      visitWhere.user = {
        assignedSectorId: query.sectorId,
      };
    }

    if (query.territoryId) {
      visitWhere.user = {
        territoryId: query.territoryId,
      };
    }

    const visitsWithOrders = await this.prisma.visit.findMany({
      where: {
        ...visitWhere,
        orders: {
          some: {},
        },
      },
      include: {
        orders: {
          select: {
            totalTtc: true,
          },
        },
      },
    });

    const totalSales = visitsWithOrders.reduce(
      (sum, visit) =>
        sum + visit.orders.reduce((orderSum, order) => orderSum + Number(order.totalTtc), 0),
      0,
    );

    const visitsWithSale = visitsWithOrders.length;
    const averageSalePerVisit = visitsWithSale > 0 ? totalSales / visitsWithSale : 0;

    return {
      value: averageSalePerVisit,
      unit: 'FCFA',
      period: query.period || PeriodEnum.MONTH,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      totalSales,
      visitsWithSale,
      averageSalePerVisit,
    };
  }

  async getAllKpis(query: KpiQueryDto): Promise<AllKpisDto> {
    const [
      chiffresAffaires,
      dropsize,
      lpc,
      tauxCouverture,
      hitRate,
      frequenceVisite,
      venteParVisite,
    ] = await Promise.all([
      this.getChiffresAffaires(query),
      this.getDropsize(query),
      this.getLpc(query),
      this.getTauxCouverture(query),
      this.getHitRate(query),
      this.getFrequenceVisite(query),
      this.getVenteParVisite(query),
    ]);

    return {
      chiffresAffaires,
      dropsize,
      lpc,
      tauxCouverture,
      hitRate,
      frequenceVisite,
      venteParVisite,
    };
  }

  async getTeamPerformance(query: KpiQueryDto): Promise<TeamPerformanceDto> {
    const dateRange = this.getDateRange(query);

    // Récupérer tous les vendeurs du territoire avec leurs stats
    const vendors = await this.prisma.user.findMany({
      where: {
        territoryId: query.territoryId,
        role: 'REP',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        orders: {
          where: {
            createdAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          select: {
            totalTtc: true,
          },
        },
        visits: {
          where: {
            checkinAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Calculer les performances de chaque vendeur
    const performances: VendorPerformanceDto[] = vendors.map((vendor) => {
      const sales = vendor.orders.reduce(
        (sum, order) => sum + Number(order.totalTtc),
        0,
      );
      const visits = vendor.visits.length;

      return {
        id: vendor.id,
        name: `${vendor.firstName} ${vendor.lastName}`,
        sales,
        visits,
      };
    });

    // Trier par ventes décroissantes
    performances.sort((a, b) => b.sales - a.sales);

    // Top 3 performers
    const topPerformers = performances.slice(0, 3).map((perf, index) => ({
      ...perf,
      rank: index + 1,
    }));

    // Bottom 2 performers (ceux à surveiller)
    const lowPerformers = performances.slice(-2).reverse();

    return {
      topPerformers,
      lowPerformers,
    };
  }
}
