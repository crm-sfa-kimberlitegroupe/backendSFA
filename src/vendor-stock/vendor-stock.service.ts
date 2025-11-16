import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorStockService {
  private readonly logger = new Logger(VendorStockService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le stock complet d'un vendeur avec les informations des SKUs
   */
  async getVendorStock(userId: string) {
    this.logger.log(`📦 [getVendorStock] Récupération stock pour vendeur ${userId}`);

    const vendorStock = await this.prisma.vendorStock.findMany({
      where: {
        userId,
        quantity: {
          gt: 0, // Seulement les produits en stock
        },
      },
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
      orderBy: {
        sku: {
          shortDescription: 'asc',
        },
      },
    });

    this.logger.log(
      `✅ [getVendorStock] ${vendorStock.length} produits en stock trouvés`,
    );

    return vendorStock;
  }

  /**
   * Récupère le stock d'un SKU spécifique pour un vendeur
   */
  async getVendorStockBySku(userId: string, skuId: string) {
    return this.prisma.vendorStock.findUnique({
      where: {
        userId_skuId: {
          userId,
          skuId,
        },
      },
      include: {
        sku: true,
      },
    });
  }

  /**
   * Récupère les statistiques du stock d'un vendeur
   */
  async getVendorStockStats(userId: string) {
    const stocks = await this.prisma.vendorStock.findMany({
      where: { userId },
      include: {
        sku: true,
      },
    });

    const totalProducts = stocks.length;
    const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0);
    const productsInStock = stocks.filter((s) => s.quantity > 0).length;
    const productsOutOfStock = stocks.filter((s) => s.quantity === 0).length;
    const lowStockProducts = stocks.filter(
      (s) => s.alertThreshold && s.quantity <= s.alertThreshold,
    ).length;

    // Mouvements du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMovements = await this.prisma.stockHistory.count({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });

    return {
      totalProducts,
      totalQuantity,
      productsInStock,
      productsOutOfStock,
      lowStockProducts,
      todayMovements,
    };
  }

  /**
   * Ajouter du stock au portefeuille du vendeur
   */
  async addStock(
    userId: string,
    items: Array<{ skuId: string; quantity: number }>,
    notes?: string,
  ) {
    this.logger.log(
      `📦 [addStock] Ajout stock pour vendeur ${userId}, ${items.length} produits`,
    );

    return this.prisma.$transaction(async (prisma) => {
      const results = [];

      for (const item of items) {
        // Vérifier que le SKU existe
        const sku = await prisma.sKU.findUnique({
          where: { id: item.skuId },
        });

        if (!sku) {
          throw new Error(`SKU ${item.skuId} introuvable`);
        }

        // Récupérer le stock actuel ou créer
        const currentStock = await prisma.vendorStock.findUnique({
          where: {
            userId_skuId: {
              userId,
              skuId: item.skuId,
            },
          },
        });

        const beforeQty = currentStock?.quantity || 0;
        const afterQty = beforeQty + item.quantity;

        // Mettre à jour ou créer le stock
        const updatedStock = await prisma.vendorStock.upsert({
          where: {
            userId_skuId: {
              userId,
              skuId: item.skuId,
            },
          },
          update: {
            quantity: afterQty,
          },
          create: {
            userId,
            skuId: item.skuId,
            quantity: item.quantity,
          },
        });

        // Créer l'historique
        await prisma.stockHistory.create({
          data: {
            userId,
            skuId: item.skuId,
            movementType: 'ADD',
            quantity: item.quantity,
            beforeQty,
            afterQty,
            notes,
          },
        });

        results.push(updatedStock);
      }

      this.logger.log(
        `✅ [addStock] Stock ajouté avec succès pour ${results.length} produits`,
      );

      return {
        success: true,
        message: `Stock ajouté avec succès pour ${results.length} produit(s)`,
        items: results,
      };
    });
  }

  /**
   * Récupère le portefeuille du vendeur
   */
  async getMyPortfolio(userId: string) {
    return this.prisma.vendorStock.findMany({
      where: {
        userId,
      },
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
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Récupère les produits avec stock faible
   */
  async getLowStockItems(userId: string, threshold = 10) {
    return this.prisma.vendorStock.findMany({
      where: {
        userId,
        OR: [
          {
            alertThreshold: {
              not: null,
            },
            quantity: {
              lte: this.prisma.vendorStock.fields.alertThreshold,
            },
          },
          {
            alertThreshold: null,
            quantity: {
              lte: threshold,
            },
          },
        ],
      },
      include: {
        sku: {
          select: {
            id: true,
            shortDescription: true,
            photo: true,
          },
        },
      },
      orderBy: {
        quantity: 'asc',
      },
    });
  }

  /**
   * Récupère l'historique des mouvements
   */
  async getHistory(userId: string, filters?: {
    movementType?: string;
    skuId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = { userId };

    if (filters?.movementType) {
      where.movementType = filters.movementType;
    }

    if (filters?.skuId) {
      where.skuId = filters.skuId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.stockHistory.findMany({
      where,
      include: {
        sku: {
          select: {
            shortDescription: true,
          },
        },
        order: {
          select: {
            id: true,
            outletId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
    });
  }
}
