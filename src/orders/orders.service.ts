import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatusEnum, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une vente avec validation du stock et mise à jour atomique
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    this.logger.log(
      `🛒 [createOrder] Création vente pour vendeur ${userId}, PDV ${createOrderDto.outletId}`,
    );

    // Validation préalable : vérifier que le vendeur existe et est REP
    const vendor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!vendor || vendor.role !== 'REP') {
      throw new BadRequestException(
        'Seuls les vendeurs (REP) peuvent créer des ventes',
      );
    }

    // Validation : vérifier que le PDV existe
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: createOrderDto.outletId },
      select: { id: true, name: true },
    });

    if (!outlet) {
      throw new NotFoundException(
        `Point de vente ${createOrderDto.outletId} introuvable`,
      );
    }

    // Validation : vérifier la visite si fournie
    if (createOrderDto.visitId) {
      const visit = await this.prisma.visit.findUnique({
        where: { id: createOrderDto.visitId },
      });

      if (!visit) {
        throw new NotFoundException(
          `Visite ${createOrderDto.visitId} introuvable`,
        );
      }
    }

    // Étape 1 : Récupérer les informations des SKUs et valider le stock
    const skuIds = createOrderDto.orderLines.map((line) => line.skuId);
    const skus = await this.prisma.sKU.findMany({
      where: { id: { in: skuIds } },
      include: {
        packSize: {
          include: {
            packFormat: {
              include: {
                brand: {
                  include: {
                    subCategory: {
                      include: {
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (skus.length !== skuIds.length) {
      const foundIds = skus.map((s) => s.id);
      const missingIds = skuIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `SKU(s) introuvable(s) : ${missingIds.join(', ')}`,
      );
    }

    // Créer un map pour accès rapide aux SKUs
    const skuMap = new Map(skus.map((sku) => [sku.id, sku]));

    // Étape 2 : Valider le stock disponible pour chaque ligne
    const stockValidations = await Promise.all(
      createOrderDto.orderLines.map(async (line) => {
        const sku = skuMap.get(line.skuId);
        const vendorStock = await this.prisma.vendorStock.findUnique({
          where: {
            userId_skuId: {
              userId,
              skuId: line.skuId,
            },
          },
        });

        return {
          skuId: line.skuId,
          skuCode: sku.code,
          skuName: sku.shortDescription,
          requestedQty: line.qty,
          availableQty: vendorStock?.quantity || 0,
          hasEnoughStock: (vendorStock?.quantity || 0) >= line.qty,
        };
      }),
    );

    // Vérifier si tous les SKUs ont suffisamment de stock
    const insufficientStock = stockValidations.filter((v) => !v.hasEnoughStock);

    if (insufficientStock.length > 0) {
      const errorMessages = insufficientStock.map(
        (v) =>
          `${v.skuName} (${v.skuCode}): demandé ${v.requestedQty}, disponible ${v.availableQty}`,
      );

      throw new BadRequestException({
        message: 'Stock insuffisant pour un ou plusieurs produits',
        errors: errorMessages,
        insufficientStock,
      });
    }

    this.logger.log('Validation stock OK, démarrage transaction');

    // Étape 3 : Transaction atomique pour créer la vente et mettre à jour le stock
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // 3.1 : Créer l'Order
          const order = await tx.order.create({
            data: {
              outletId: createOrderDto.outletId,
              userId,
              visitId: createOrderDto.visitId,
              status: createOrderDto.status || OrderStatusEnum.DRAFT,
              currency: 'XOF',
              discountTotal: new Decimal(0),
              taxTotal: new Decimal(0),
              totalHt: new Decimal(0),
              totalTtc: new Decimal(0),
            },
          });

          this.logger.log(`Order créé : ${order.id}`);

          // 3.2 : Créer les OrderLines avec calculs
          let totalHt = new Decimal(0);
          let totalTtc = new Decimal(0);
          let totalDiscount = new Decimal(0);

          const orderLines = await Promise.all(
            createOrderDto.orderLines.map(async (lineDto) => {
              const sku = skuMap.get(lineDto.skuId);

              // Utiliser le prix du DTO ou celui du SKU
              const unitPrice = lineDto.unitPrice
                ? new Decimal(lineDto.unitPrice)
                : sku.priceHt;
              const vatRate = lineDto.vatRate
                ? new Decimal(lineDto.vatRate)
                : sku.vatRate;

              // Calculs
              const lineTotalHt = unitPrice.mul(lineDto.qty);
              const lineTotalTtc = lineTotalHt.mul(
                new Decimal(1).add(vatRate.div(100)),
              );

              // Accumuler les totaux
              totalHt = totalHt.add(lineTotalHt);
              totalTtc = totalTtc.add(lineTotalTtc);

              // Gérer les promotions
              if (lineDto.discountAmount) {
                totalDiscount = totalDiscount.add(
                  new Decimal(lineDto.discountAmount).mul(lineDto.qty),
                );
              }

              // Créer la ligne
              const orderLine = await tx.orderLine.create({
                data: {
                  orderId: order.id,
                  skuId: lineDto.skuId,
                  qty: lineDto.qty,
                  unitPrice,
                  vatRate,
                  lineTotalHt,
                  lineTotalTtc,
                  discountAmount: lineDto.discountAmount
                    ? new Decimal(lineDto.discountAmount)
                    : new Decimal(0),
                  promotionId: lineDto.promotionId,
                },
              });

              this.logger.log(
                `OrderLine créée : ${orderLine.id} (SKU: ${lineDto.skuId})`,
              );

              // 3.3 : Mettre à jour le stock du vendeur
              const vendorStock = await tx.vendorStock.findUnique({
                where: {
                  userId_skuId: {
                    userId,
                    skuId: lineDto.skuId,
                  },
                },
              });

              if (!vendorStock) {
                throw new BadRequestException(
                  `Stock non trouvé pour SKU ${lineDto.skuId}`,
                );
              }

              const beforeQty = vendorStock.quantity;
              const afterQty = beforeQty - lineDto.qty;

              if (afterQty < 0) {
                throw new BadRequestException(
                  `Stock insuffisant pour SKU ${lineDto.skuId}: ${beforeQty} disponible, ${lineDto.qty} demandé`,
                );
              }

              // Mettre à jour le stock
              await tx.vendorStock.update({
                where: {
                  userId_skuId: {
                    userId,
                    skuId: lineDto.skuId,
                  },
                },
                data: {
                  quantity: afterQty,
                },
              });

              // Créer l'historique
              await tx.stockHistory.create({
                data: {
                  userId,
                  skuId: lineDto.skuId,
                  movementType: 'SALE',
                  quantity: -lineDto.qty,
                  beforeQty,
                  afterQty,
                  orderId: order.id,
                  notes: `Vente au PDV ${outlet.name}`,
                },
              });

              this.logger.log(
                ` Stock mis à jour pour SKU ${lineDto.skuId}: ${beforeQty} → ${afterQty}`,
              );

              return orderLine;
            }),
          );

          this.logger.log(`${orderLines.length} OrderLines créées`);

          // 3.4 : Mettre à jour les totaux de l'Order
          const finalTotalHt = totalHt.sub(totalDiscount);
          const finalTaxTotal = totalTtc.sub(finalTotalHt);

          await tx.order.update({
            where: { id: order.id },
            data: {
              totalHt: finalTotalHt,
              totalTtc: totalTtc,
              taxTotal: finalTaxTotal,
              discountTotal: totalDiscount,
            },
          });

          this.logger.log(
            `Totaux mis à jour - HT: ${finalTotalHt.toString()}, TTC: ${totalTtc.toString()}, Tax: ${finalTaxTotal.toString()}`,
          );

          // 3.5 : Créer les paiements si fournis
          if (createOrderDto.payments && createOrderDto.payments.length > 0) {
            const payments = await Promise.all(
              createOrderDto.payments.map((payment) =>
                tx.payment.create({
                  data: {
                    orderId: order.id,
                    method: payment.method,
                    amount: new Decimal(payment.amount),
                    paidAt: payment.paidAt
                      ? new Date(payment.paidAt)
                      : new Date(),
                    transactionRef: payment.transactionRef,
                    meta: payment.meta as Prisma.JsonObject,
                  },
                }),
              ),
            );

            this.logger.log(`${payments.length} paiement(s) enregistré(s)`);
          }

          // Retourner l'order complet avec toutes les relations
          return tx.order.findUnique({
            where: { id: order.id },
            include: {
              orderLines: {
                include: {
                  sku: {
                    include: {
                      packSize: {
                        include: {
                          packFormat: {
                            include: {
                              brand: {
                                include: {
                                  subCategory: {
                                    include: {
                                      category: true,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              payments: true,
              outlet: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          });
        },
        {
          timeout: 30000, // 30 secondes au lieu de 5 par défaut
        },
      );

      this.logger.log(`Vente ${result.id} créée avec succès`);

      return {
        success: true,
        message: 'Vente enregistrée avec succès',
        order: result,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la transaction:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(
        `Erreur lors de la création de la vente: ${errorMessage}`,
      );
    }
  }

  /**
   * Récupère les ventes d'un vendeur
   */
  async getVendorOrders(
    userId: string,
    filters?: {
      outletId?: string;
      status?: OrderStatusEnum;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    // Gestion correcte des filtres de date
    let dateFilter: Prisma.OrderWhereInput = {};
    if (filters?.startDate || filters?.endDate) {
      const createdAtFilter: { gte?: Date; lte?: Date } = {};

      if (filters.startDate) {
        // Début de la journée (00:00:00)
        const startOfDay = new Date(filters.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        createdAtFilter.gte = startOfDay;
      }

      if (filters.endDate) {
        // Fin de la journée (23:59:59.999)
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        createdAtFilter.lte = endOfDay;
      }
      dateFilter = { createdAt: createdAtFilter };
    }

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(filters?.outletId && { outletId: filters.outletId }),
      ...(filters?.status && { status: filters.status }),
      ...dateFilter,
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        orderLines: {
          include: {
            sku: {
              include: {
                packSize: {
                  include: {
                    packFormat: {
                      include: {
                        brand: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  }

  /**
   * Récupère une vente par ID
   */
  async getOrderById(orderId: string, userId?: string) {
    const where: Prisma.OrderWhereUniqueInput = { id: orderId };

    const order = await this.prisma.order.findUnique({
      where,
      include: {
        orderLines: {
          include: {
            sku: {
              include: {
                packSize: {
                  include: {
                    packFormat: {
                      include: {
                        brand: {
                          include: {
                            subCategory: {
                              include: {
                                category: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        payments: true,
        outlet: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Vente ${orderId} introuvable`);
    }

    // Si userId fourni, vérifier que la vente appartient au vendeur
    if (userId && order.userId !== userId) {
      throw new BadRequestException('Vous n avez pas accès à cette vente');
    }

    return order;
  }

  /**
   * Récupère les statistiques de ventes d'un vendeur
   */
  async getVendorSalesStats(userId: string, period?: 'day' | 'week' | 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0); // Depuis le début
    }

    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        orderLines: true,
        payments: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalTtc),
      0,
    );
    const totalItems = orders.reduce(
      (sum, order) =>
        sum + order.orderLines.reduce((lineSum, line) => lineSum + line.qty, 0),
      0,
    );
    const totalPaid = orders.reduce(
      (sum, order) =>
        sum +
        order.payments.reduce(
          (paySum, payment) => paySum + Number(payment.amount),
          0,
        ),
      0,
    );

    return {
      period,
      totalOrders,
      totalRevenue,
      totalItems,
      totalPaid,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }
}
