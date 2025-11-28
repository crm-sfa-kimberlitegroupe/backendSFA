import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorStockService {
  private readonly logger = new Logger(VendorStockService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le stock complet d'un vendeur avec les informations des SKUs
   */
  async getVendorStock(userId: string) {
    this.logger.log(
      `[getVendorStock] Récupération stock pour vendeur ${userId}`,
    );

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
      `[getVendorStock] ${vendorStock.length} produits en stock trouves`,
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
      `[addStock] Ajout stock pour vendeur ${userId}, ${items.length} produits`,
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
        ` [addStock] Stock ajouté avec succès pour ${results.length} produits`,
      );

      return {
        success: true,
        message: `Stock ajouté avec succès pour ${results.length} produit(s)`,
        items: results,
      };
    });
  }

  /**
   * Recupere le portefeuille du vendeur (produits avec stock > 0)
   */
  async getMyPortfolio(userId: string) {
    return this.prisma.vendorStock.findMany({
      where: {
        userId,
        quantity: {
          gt: 0,
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
            AND: [
              {
                alertThreshold: {
                  not: null,
                },
              },
              {
                quantity: {
                  lte: threshold,
                },
              },
            ],
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
  async getHistory(
    userId: string,
    filters?: {
      movementType?: 'ADD' | 'REMOVE' | 'SALE' | 'ADJUSTMENT';
      skuId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ) {
    const where: Prisma.StockHistoryWhereInput = { userId };

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

  /**
   * Supprimer un produit specifique du stock du vendeur
   */
  async removeProduct(userId: string, skuId: string, notes?: string) {
    this.logger.log(`[removeProduct] Suppression du produit ${skuId} pour vendeur ${userId}`);

    return this.prisma.$transaction(async (prisma) => {
      // Verifier que le produit existe dans le stock du vendeur
      const currentStock = await prisma.vendorStock.findUnique({
        where: {
          userId_skuId: {
            userId,
            skuId,
          },
        },
        include: {
          sku: {
            select: {
              shortDescription: true,
            },
          },
        },
      });

      if (!currentStock) {
        return {
          success: false,
          message: 'Produit non trouve dans votre stock',
        };
      }

      if (currentStock.quantity === 0) {
        // Supprimer l'enregistrement si quantite = 0
        await prisma.vendorStock.delete({
          where: {
            userId_skuId: {
              userId,
              skuId,
            },
          },
        });

        return {
          success: true,
          message: 'Produit supprime du portefeuille',
          productName: currentStock.sku?.shortDescription,
          deletedQuantity: 0,
        };
      }

      // Creer l'historique du mouvement
      await prisma.stockHistory.create({
        data: {
          userId,
          skuId,
          movementType: 'REMOVE',
          quantity: currentStock.quantity,
          beforeQty: currentStock.quantity,
          afterQty: 0,
          notes: notes || 'Suppression du produit du portefeuille',
        },
      });

      // Supprimer le produit du stock
      await prisma.vendorStock.delete({
        where: {
          userId_skuId: {
            userId,
            skuId,
          },
        },
      });

      this.logger.log(
        `[removeProduct] Produit ${currentStock.sku?.shortDescription} supprime (${currentStock.quantity} unites)`,
      );

      return {
        success: true,
        message: `Produit supprime avec succes`,
        productName: currentStock.sku?.shortDescription,
        deletedQuantity: currentStock.quantity,
      };
    });
  }

  /**
   * Supprimer plusieurs produits du stock du vendeur
   */
  async removeMultipleProducts(userId: string, skuIds: string[], notes?: string) {
    this.logger.log(`[removeMultipleProducts] userId: ${userId}`);
    this.logger.log(`[removeMultipleProducts] skuIds: ${JSON.stringify(skuIds)}`);
    this.logger.log(`[removeMultipleProducts] notes: ${notes}`);

    // Verification des parametres
    if (!skuIds || !Array.isArray(skuIds) || skuIds.length === 0) {
      this.logger.warn('[removeMultipleProducts] skuIds invalide ou vide');
      return {
        success: false,
        message: 'Liste de produits invalide ou vide',
        deletedCount: 0,
      };
    }

    this.logger.log(
      `[removeMultipleProducts] Suppression de ${skuIds.length} produits pour vendeur ${userId}`,
    );

    return this.prisma.$transaction(
      async (prisma) => {
        // Recuperer les produits a supprimer
        const productsToDelete = await prisma.vendorStock.findMany({
          where: {
            userId,
            skuId: {
              in: skuIds,
            },
          },
        });

        if (productsToDelete.length === 0) {
          return {
            success: false,
            message: 'Aucun produit trouve dans votre stock',
            deletedCount: 0,
          };
        }

        // Preparer les donnees d'historique en batch
        const historyData = productsToDelete
          .filter((stock) => stock.quantity > 0)
          .map((stock) => ({
            userId,
            skuId: stock.skuId,
            movementType: 'REMOVE',
            quantity: stock.quantity,
            beforeQty: stock.quantity,
            afterQty: 0,
            notes: notes || 'Suppression multiple de produits',
          }));

        // Creer l'historique en batch (beaucoup plus rapide)
        if (historyData.length > 0) {
          await prisma.stockHistory.createMany({
            data: historyData,
          });
        }

        // Supprimer les produits
        const deleteResult = await prisma.vendorStock.deleteMany({
          where: {
            userId,
            skuId: {
              in: skuIds,
            },
          },
        });

        this.logger.log(
          `[removeMultipleProducts] ${deleteResult.count} produits supprimes`,
        );

        return {
          success: true,
          message: `${deleteResult.count} produit(s) supprime(s) avec succes`,
          deletedCount: deleteResult.count,
        };
      },
      {
        timeout: 30000, // 30 secondes au lieu de 5
      },
    );
  }

  /**
   * Vider completement le stock du vendeur (dechargement)
   */
  async unloadAllStock(userId: string, notes?: string) {
    this.logger.log(`[unloadAllStock] Déchargement complet du stock pour vendeur ${userId}`);

    return this.prisma.$transaction(async (prisma) => {
      // Récupérer tous les produits en stock
      const currentStock = await prisma.vendorStock.findMany({
        where: {
          userId,
          quantity: {
            gt: 0,
          },
        },
        include: {
          sku: {
            select: {
              shortDescription: true,
            },
          },
        },
      });

      if (currentStock.length === 0) {
        return {
          success: true,
          message: 'Aucun stock à décharger',
          deletedCount: 0,
        };
      }

      // Créer l'historique pour chaque produit déchargé
      for (const stock of currentStock) {
        await prisma.stockHistory.create({
          data: {
            userId,
            skuId: stock.skuId,
            movementType: 'REMOVE',
            quantity: stock.quantity,
            beforeQty: stock.quantity,
            afterQty: 0,
            notes: notes || 'Déchargement complet du stock',
          },
        });
      }

      // Supprimer tous les enregistrements VendorStock du vendeur
      const deleteResult = await prisma.vendorStock.deleteMany({
        where: {
          userId,
        },
      });

      this.logger.log(
        `[unloadAllStock] ${deleteResult.count} produits decharges avec succes`,
      );

      return {
        success: true,
        message: `Stock déchargé avec succès: ${deleteResult.count} produit(s) supprimé(s)`,
        deletedCount: deleteResult.count,
      };
    });
  }
}
