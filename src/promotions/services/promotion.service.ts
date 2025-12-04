import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePromotionDto, UpdatePromotionDto } from '../dto/promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // CRUD PROMOTIONS
  // ========================================

  async createPromotion(dto: CreatePromotionDto) {
    try {
      // Validate dates
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      // Create promotion
      const promotion = await this.prisma.promotion.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          value: dto.value,
          startDate,
          endDate,
          active: dto.active ?? true,
          applyToLevel: dto.applyToLevel,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          subBrandId: dto.subBrandId,
          packFormatId: dto.packFormatId,
          minQuantity: dto.minQuantity,
          maxDiscount: dto.maxDiscount,
        },
      });

      // If specific SKUs provided, add them
      if (dto.skuIds && dto.skuIds.length > 0) {
        await this.addSKUsToPromotion(promotion.id, dto.skuIds);
      }

      // If applying to a hierarchy level, auto-add all SKUs
      if (dto.applyToLevel) {
        await this.autoAddSKUsByHierarchy(promotion);
      }

      return await this.getPromotion(promotion.id);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Promotion code already exists');
      }
      throw error;
    }
  }

  async getPromotions(active?: boolean, current?: boolean) {
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (current) {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    return await this.prisma.promotion.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { skus: true },
        },
        category: true,
        brand: true,
        subBrand: true,
        packFormat: true,
      },
    });
  }

  async getPromotion(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        subBrand: true,
        packFormat: true,
        skus: {
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
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto) {
    try {
      const updateData: any = { ...dto };

      // Validate dates if provided
      if (dto.startDate || dto.endDate) {
        const promotion = await this.prisma.promotion.findUnique({
          where: { id },
        });

        if (!promotion) {
          throw new NotFoundException('Promotion not found');
        }

        const startDate = dto.startDate ? new Date(dto.startDate) : promotion.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : promotion.endDate;

        if (startDate >= endDate) {
          throw new BadRequestException('End date must be after start date');
        }

        if (dto.startDate) updateData.startDate = startDate;
        if (dto.endDate) updateData.endDate = endDate;
      }

      return await this.prisma.promotion.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          brand: true,
          subBrand: true,
          packFormat: true,
          _count: {
            select: { skus: true },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Promotion not found');
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Promotion code already exists');
      }
      throw error;
    }
  }

  async deletePromotion(id: string) {
    try {
      return await this.prisma.promotion.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Promotion not found');
      }
      throw error;
    }
  }

  // ========================================
  // SKU MANAGEMENT
  // ========================================

  async addSKUsToPromotion(promotionId: string, skuIds: string[]) {
    // Verify promotion exists
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Verify all SKUs exist
    const skus = await this.prisma.sKU.findMany({
      where: {
        id: { in: skuIds },
      },
    });

    if (skus.length !== skuIds.length) {
      throw new BadRequestException('One or more SKUs not found');
    }

    // Get existing mappings
    const existingMappings = await this.prisma.promotionSKU.findMany({
      where: {
        promotionId,
        skuId: { in: skuIds },
      },
    });

    const existingSkuIds = new Set(existingMappings.map(m => m.skuId));
    const newSkuIds = skuIds.filter(id => !existingSkuIds.has(id));

    if (newSkuIds.length === 0) {
      return { message: 'All SKUs are already in the promotion', added: 0 };
    }

    // Create new mappings
    const result = await this.prisma.promotionSKU.createMany({
      data: newSkuIds.map(skuId => ({
        promotionId,
        skuId,
      })),
    });

    return {
      message: `Added ${result.count} SKUs to the promotion`,
      added: result.count,
      alreadyExisted: existingMappings.length,
    };
  }

  async removeSKUFromPromotion(promotionId: string, skuId: string) {
    try {
      await this.prisma.promotionSKU.delete({
        where: {
          promotionId_skuId: {
            promotionId,
            skuId,
          },
        },
      });

      return { message: 'SKU removed from promotion successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SKU not found in this promotion');
      }
      throw error;
    }
  }

  // ========================================
  // PROMOTION APPLICATION
  // ========================================

  async getActivePromotionsForSKU(skuId: string, date?: Date) {
    const targetDate = date || new Date();

    // Get SKU with hierarchy
    const sku = await this.prisma.sKU.findUnique({
      where: { id: skuId },
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

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    // Find all applicable promotions
    const promotions = await this.prisma.promotion.findMany({
      where: {
        active: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
        OR: [
          // Direct SKU promotion
          {
            skus: {
              some: { skuId },
            },
          },
          // Pack format level
          {
            applyToLevel: 'PACK_FORMAT',
            packFormatId: sku.packSize?.packFormatId,
          },
          // Brand level
          {
            applyToLevel: 'BRAND',
            brandId: sku.packSize?.packFormat?.brandId,
          },
          // Category level
          {
            applyToLevel: 'CATEGORY',
            categoryId: sku.packSize?.packFormat?.brand?.subCategory?.categoryId,
          },
        ],
      },
      orderBy: { value: 'desc' }, // Best discount first
    });

    return promotions;
  }

  async calculatePromotionalPrice(
    originalPrice: number | Prisma.Decimal,
    promotion: any,
    quantity?: number
  ) {
    const price = new Prisma.Decimal(originalPrice);

    // Check minimum quantity if specified
    if (promotion.minQuantity && quantity && quantity < promotion.minQuantity) {
      return {
        originalPrice: price,
        discountAmount: new Prisma.Decimal(0),
        finalPrice: price,
        promotionApplied: false,
      };
    }

    let discountAmount = new Prisma.Decimal(0);
    let finalPrice = price;

    switch (promotion.type) {
      case 'PERCENTAGE':
        discountAmount = price.mul(promotion.value).div(100);
        if (promotion.maxDiscount) {
          const maxDiscount = new Prisma.Decimal(promotion.maxDiscount);
          if (discountAmount.gt(maxDiscount)) {
            discountAmount = maxDiscount;
          }
        }
        finalPrice = price.sub(discountAmount);
        break;

      case 'FIXED_AMOUNT':
        discountAmount = new Prisma.Decimal(promotion.value);
        if (discountAmount.gt(price)) {
          discountAmount = price;
        }
        finalPrice = price.sub(discountAmount);
        break;

      case 'BUY_X_GET_Y':
        // This requires special handling based on quantity
        // For now, we'll apply a simple percentage based on the value
        if (quantity && quantity >= (promotion.minQuantity || 1)) {
          const freeItems = Math.floor(quantity / (promotion.minQuantity || 1));
          const effectiveDiscount = (freeItems / quantity) * 100;
          discountAmount = price.mul(effectiveDiscount).div(100);
          finalPrice = price.sub(discountAmount);
        }
        break;
    }

    return {
      originalPrice: price,
      discountAmount,
      finalPrice,
      promotionApplied: true,
      promotionId: promotion.id,
      promotionName: promotion.name,
      promotionType: promotion.type,
    };
  }

  async applyBestPromotionToItem(skuId: string, unitPrice: number, quantity: number) {
    const promotions = await this.getActivePromotionsForSKU(skuId);

    if (promotions.length === 0) {
      return {
        unitPrice: new Prisma.Decimal(unitPrice),
        promotionId: null,
        discountAmount: new Prisma.Decimal(0),
      };
    }

    // Calculate price for each promotion and choose the best
    let bestPromotion = null;
    let bestFinalPrice = new Prisma.Decimal(unitPrice);
    let bestDiscountAmount = new Prisma.Decimal(0);

    for (const promotion of promotions) {
      const result = await this.calculatePromotionalPrice(unitPrice, promotion, quantity);
      if (result.promotionApplied && result.finalPrice.lt(bestFinalPrice)) {
        bestFinalPrice = result.finalPrice;
        bestDiscountAmount = result.discountAmount;
        bestPromotion = promotion;
      }
    }

    return {
      unitPrice: bestFinalPrice,
      originalUnitPrice: new Prisma.Decimal(unitPrice),
      promotionId: bestPromotion?.id || null,
      discountAmount: bestDiscountAmount,
      promotionName: bestPromotion?.name,
    };
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private async autoAddSKUsByHierarchy(promotion: any) {
    let skuIds: string[] = [];

    switch (promotion.applyToLevel) {
      case 'CATEGORY':
        if (promotion.categoryId) {
          const skus = await this.prisma.sKU.findMany({
            where: {
              packSize: {
                packFormat: {
                  brand: {
                    subCategory: {
                      categoryId: promotion.categoryId,
                    },
                  },
                },
              },
              active: true,
              isSaleable: true,
            },
            select: { id: true },
          });
          skuIds = skus.map(s => s.id);
        }
        break;

      case 'BRAND':
        if (promotion.brandId) {
          const skus = await this.prisma.sKU.findMany({
            where: {
              packSize: {
                packFormat: {
                  brandId: promotion.brandId,
                },
              },
              active: true,
              isSaleable: true,
            },
            select: { id: true },
          });
          skuIds = skus.map(s => s.id);
        }
        break;

      case 'SUB_BRAND':
        // SUB_BRAND level is deprecated, use BRAND instead
        if (promotion.subBrandId) {
          const skus = await this.prisma.sKU.findMany({
            where: {
              packSize: {
                packFormat: {
                  brandId: promotion.subBrandId, // Fallback: treat subBrandId as brandId
                },
              },
              active: true,
              isSaleable: true,
            },
            select: { id: true },
          });
          skuIds = skus.map(s => s.id);
        }
        break;

      case 'PACK_FORMAT':
        if (promotion.packFormatId) {
          const skus = await this.prisma.sKU.findMany({
            where: {
              packSize: {
                packFormatId: promotion.packFormatId,
              },
              active: true,
              isSaleable: true,
            },
            select: { id: true },
          });
          skuIds = skus.map(s => s.id);
        }
        break;
    }

    if (skuIds.length > 0) {
      await this.prisma.promotionSKU.createMany({
        data: skuIds.map(skuId => ({
          promotionId: promotion.id,
          skuId,
        })),
        skipDuplicates: true,
      });
    }
  }
}
