import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSKUGroupDto, UpdateSKUGroupDto } from '../dto/sku-group.dto';
import { CreateSellerSKUGroupMappingDto } from '../dto/seller-sku-group-mapping.dto';

@Injectable()
export class SKUGroupService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // SKU GROUPS
  // ========================================

  async createSKUGroup(dto: CreateSKUGroupDto) {
    try {
      return await this.prisma.sKUGroup.create({
        data: {
          code: dto.code,
          description: dto.description,
          active: dto.active ?? true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('SKU Group code already exists');
      }
      throw error;
    }
  }

  async getSKUGroups(active?: boolean) {
    const where = active !== undefined ? { active } : {};
    return await this.prisma.sKUGroup.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            skuMappings: true,
            sellerMappings: true,
          },
        },
      },
    });
  }

  async getSKUGroup(id: string) {
    const group = await this.prisma.sKUGroup.findUnique({
      where: { id },
      include: {
        skuMappings: {
          include: {
            sku: true,
          },
        },
        sellerMappings: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            routePlan: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('SKU Group not found');
    }

    return group;
  }

  async updateSKUGroup(id: string, dto: UpdateSKUGroupDto) {
    try {
      return await this.prisma.sKUGroup.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SKU Group not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('SKU Group code already exists');
      }
      throw error;
    }
  }

  async deleteSKUGroup(id: string) {
    try {
      return await this.prisma.sKUGroup.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SKU Group not found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete SKU Group with existing mappings',
        );
      }
      throw error;
    }
  }

  // ========================================
  // SKU MAPPINGS
  // ========================================

  async addSKUsToGroup(groupId: string, skuIds: string[]) {
    // Verify group exists
    const group = await this.prisma.sKUGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('SKU Group not found');
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
    const existingMappings = await this.prisma.sKUGroupMapping.findMany({
      where: {
        groupId,
        skuId: { in: skuIds },
      },
    });

    const existingSkuIds = new Set(existingMappings.map(m => m.skuId));
    const newSkuIds = skuIds.filter(id => !existingSkuIds.has(id));

    if (newSkuIds.length === 0) {
      return { message: 'All SKUs are already in the group', added: 0 };
    }

    // Create new mappings
    const result = await this.prisma.sKUGroupMapping.createMany({
      data: newSkuIds.map(skuId => ({
        groupId,
        skuId,
      })),
    });

    return {
      message: `Added ${result.count} SKUs to the group`,
      added: result.count,
      alreadyExisted: existingMappings.length,
    };
  }

  async removeSKUFromGroup(groupId: string, skuId: string) {
    try {
      await this.prisma.sKUGroupMapping.delete({
        where: {
          skuId_groupId: {
            skuId,
            groupId,
          },
        },
      });

      return { message: 'SKU removed from group successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SKU mapping not found in this group');
      }
      throw error;
    }
  }

  async getSKUsInGroup(groupId: string) {
    const group = await this.prisma.sKUGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('SKU Group not found');
    }

    const mappings = await this.prisma.sKUGroupMapping.findMany({
      where: { groupId },
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
    });

    return mappings.map(m => m.sku);
  }

  // ========================================
  // SELLER MAPPINGS
  // ========================================

  async assignGroupToSeller(dto: CreateSellerSKUGroupMappingDto) {
    // Verify seller exists and is a REP
    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (seller.role !== 'REP') {
      throw new BadRequestException(
        'User must be a REP to be assigned SKU groups',
      );
    }

    // Verify group exists
    const group = await this.prisma.sKUGroup.findUnique({
      where: { id: dto.skuGroupId },
    });

    if (!group) {
      throw new NotFoundException('SKU Group not found');
    }

    // Verify route plan if provided
    if (dto.routePlanId) {
      const routePlan = await this.prisma.routePlan.findUnique({
        where: { id: dto.routePlanId },
      });

      if (!routePlan) {
        throw new NotFoundException('Route plan not found');
      }

      if (routePlan.userId !== dto.sellerId) {
        throw new BadRequestException(
          'Route plan does not belong to this seller',
        );
      }
    }

    try {
      return await this.prisma.sellerSKUGroupMapping.create({
        data: {
          sellerId: dto.sellerId,
          groupId: dto.skuGroupId,
          routePlanId: dto.routePlanId,
        },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          group: true,
          routePlan: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('This mapping already exists');
      }
      throw error;
    }
  }

  async removeSellerMapping(mappingId: string) {
    try {
      return await this.prisma.sellerSKUGroupMapping.delete({
        where: { id: mappingId },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Seller mapping not found');
      }
      throw error;
    }
  }

  async getSellerMappings(sellerId?: string, groupId?: string) {
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (groupId) where.groupId = groupId;

    return await this.prisma.sellerSKUGroupMapping.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        group: {
          include: {
            _count: {
              select: { skuMappings: true },
            },
          },
        },
        routePlan: true,
      },
    });
  }

  async getAvailableSKUsForSeller(sellerId: string, routePlanId?: string) {
    // Get all group mappings for this seller
    const where: any = { sellerId };
    if (routePlanId) {
      where.OR = [
        { routePlanId },
        { routePlanId: null },
      ];
    }

    const sellerMappings = await this.prisma.sellerSKUGroupMapping.findMany({
      where,
      select: {
        groupId: true,
      },
    });

    if (sellerMappings.length === 0) {
      return [];
    }

    const groupIds = sellerMappings.map(m => m.groupId);

    // Get all SKUs in these groups
    const skuMappings = await this.prisma.sKUGroupMapping.findMany({
      where: {
        groupId: { in: groupIds },
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
            vendorStocks: {
              where: { userId: sellerId },
              select: {
                quantity: true,
              },
            },
          },
        },
        group: true,
      },
    });

    // Remove duplicates and format response
    const skuMap = new Map();

    for (const mapping of skuMappings) {
      if (!skuMap.has(mapping.skuId)) {
        const sku = mapping.sku;
        const vendorStock = sku.vendorStocks[0];
        skuMap.set(mapping.skuId, {
          ...sku,
          availableStock: vendorStock?.quantity || 0,
          groups: [mapping.group],
        });
      } else {
        const existing = skuMap.get(mapping.skuId);
        existing.groups.push(mapping.group);
      }
    }

    return Array.from(skuMap.values());
  }
}
