import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
} from '../dto/sub-category.dto';
import { CreateBrandDto } from '../dto/brand.dto';
import { CreateSubBrandDto } from '../dto/sub-brand.dto';
import { CreatePackFormatDto } from '../dto/pack-format.dto';
import { CreatePackSizeDto } from '../dto/pack-size.dto';
import { CreateSKUDto, UpdateSKUDto, SKUQueryDto } from '../dto/sku.dto';

@Injectable()
export class ProductHierarchyService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // CATEGORIES
  // ========================================

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.productCategory.create({
        data: {
          code: dto.code,
          name: dto.name,
          displayName: dto.displayName,
          description: dto.description,
          sortOrder: dto.sortOrder || 0,
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category code already exists');
      }
      throw error;
    }
  }

  async getCategories(active?: boolean) {
    const where = active !== undefined ? { active } : {};
    return await this.prisma.productCategory.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { subCategories: true },
        },
      },
    });
  }

  async getCategory(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        subCategories: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.productCategory.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Category code already exists');
      }
      throw error;
    }
  }

  async toggleCategoryStatus(id: string) {
    return await this.prisma.$transaction(async (tx) => {
      const category = await tx.productCategory.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const newStatus = !category.active;

      // Update category
      await tx.productCategory.update({
        where: { id },
        data: { active: newStatus },
      });

      // Cascade to all children if deactivating
      if (!newStatus) {
        await this.cascadeDeactivate(tx, id, 'category');
      }

      return { active: newStatus };
    });
  }

  async deleteCategory(id: string) {
    // Check if category has SKUs
    const skuCount = await this.prisma.sKU.count({
      where: {
        packSize: {
          packFormat: {
            brand: {
              subCategory: {
                categoryId: id,
              },
            },
          },
        },
      },
    });

    if (skuCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${skuCount} SKUs. Deactivate instead.`,
      );
    }

    try {
      return await this.prisma.productCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  // ========================================
  // SUB-CATEGORIES
  // ========================================

  async createSubCategory(dto: CreateSubCategoryDto) {
    try {
      return await this.prisma.productSubCategory.create({
        data: {
          code: dto.code,
          name: dto.name,
          displayName: dto.displayName,
          categoryId: dto.categoryId,
          sortOrder: dto.sortOrder || 0,
          active: dto.active ?? true,
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('SubCategory code already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid category ID');
      }
      throw error;
    }
  }

  async getSubCategories(categoryId?: string, active?: boolean) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.active = active;

    return await this.prisma.productSubCategory.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        _count: {
          select: { brands: true },
        },
      },
    });
  }

  async getSubCategory(id: string) {
    const subCategory = await this.prisma.productSubCategory.findUnique({
      where: { id },
      include: {
        category: true,
        brands: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }

    return subCategory;
  }

  async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
    try {
      return await this.prisma.productSubCategory.update({
        where: { id },
        data: dto,
        include: {
          category: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SubCategory not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('SubCategory code already exists');
      }
      throw error;
    }
  }

  // ========================================
  // BRANDS
  // ========================================

  async createBrand(dto: CreateBrandDto) {
    try {
      return await this.prisma.productBrand.create({
        data: {
          code: dto.code,
          name: dto.name,
          displayName: dto.displayName,
          subCategoryId: dto.subCategoryId,
          sortOrder: dto.sortOrder || 0,
          active: dto.active ?? true,
        },
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Brand code already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid subcategory ID');
      }
      throw error;
    }
  }

  async getBrands(subCategoryId?: string, active?: boolean) {
    const where: any = {};
    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (active !== undefined) where.active = active;

    return await this.prisma.productBrand.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { subBrands: true },
        },
      },
    });
  }

  // ========================================
  // SUB-BRANDS
  // ========================================

  async createSubBrand(dto: CreateSubBrandDto) {
    try {
      return await this.prisma.productSubBrand.create({
        data: {
          code: dto.code,
          name: dto.name,
          displayName: dto.displayName,
          brandId: dto.brandId,
          sortOrder: dto.sortOrder || 0,
          active: dto.active ?? true,
        },
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
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('SubBrand code already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid brand ID');
      }
      throw error;
    }
  }

  // ========================================
  // PACK FORMATS
  // ========================================

  async getPackFormats(activeOnly?: boolean, brandId?: string) {
    try {
      const where: any = {};
      if (activeOnly) where.active = true;
      if (brandId) where.brandId = brandId;
      
      return await this.prisma.productPackFormat.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      throw error;
    }
  }

  async createPackFormat(dto: CreatePackFormatDto) {
    try {
      return await this.prisma.productPackFormat.create({
        data: {
          code: dto.code,
          name: dto.name,
          displayName: dto.displayName,
          brandId: dto.brandId,
          sortOrder: dto.sortOrder || 0,
          active: dto.active ?? true,
        },
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
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('PackFormat code already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid brand ID');
      }
      throw error;
    }
  }

  // ========================================
  // PACK SIZES
  // ========================================

  async getPackSizes(activeOnly?: boolean, packFormatId?: string) {
    try {
      const where: any = {};
      if (activeOnly) where.active = true;
      if (packFormatId) where.packFormatId = packFormatId;
      
      return await this.prisma.productPackSize.findMany({
        where,
        include: {
          packFormat: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      throw error;
    }
  }

  async createPackSize(dto: CreatePackSizeDto) {
    try {
      return await this.prisma.productPackSize.create({
        data: {
          code: dto.code,
          name: dto.name,
          displayName: dto.displayName,
          packFormatId: dto.packFormatId,
          sortOrder: dto.sortOrder || 0,
          active: dto.active ?? true,
        },
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
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('PackSize code already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid pack format ID');
      }
      throw error;
    }
  }

  // ========================================
  // SKU
  // ========================================

  async createSKU(dto: CreateSKUDto) {
    try {
      // Calculate price TTC
      const priceHt = new Prisma.Decimal(dto.priceHt);
      const vatRate = new Prisma.Decimal(dto.vatRate);
      const priceTtc = priceHt.mul(vatRate.div(100).add(1));

      return await this.prisma.sKU.create({
        data: {
          code: dto.code,
          ean: dto.ean,
          fullDescription: dto.fullDescription,
          shortDescription: dto.shortDescription,
          packSizeId: dto.packSizeId,
          barCode: dto.barCode,
          baseUom: dto.baseUom || 'Piece',
          defaultUom: dto.defaultUom || 'Piece',
          priceHt: dto.priceHt,
          vatRate: dto.vatRate,
          priceTtc,
          photo: dto.photo,
          weight: dto.weight,
          volume: dto.volume,
          isSaleable: dto.isSaleable ?? true,
          active: dto.active ?? true,
        },
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
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('code')) {
          throw new ConflictException('SKU code already exists');
        }
        if (target?.includes('ean')) {
          throw new ConflictException('EAN already exists');
        }
        throw new ConflictException('SKU already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid pack size ID');
      }
      throw error;
    }
  }

  async getSKUs(query: SKUQueryDto) {
    const {
      categoryId,
      subCategoryId,
      brandId,
      subBrandId,
      packFormatId,
      packSizeId,
      active,
      isSaleable,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (active !== undefined) where.active = active;
    if (isSaleable !== undefined) where.isSaleable = isSaleable;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { ean: { contains: search, mode: 'insensitive' } },
        { fullDescription: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (packSizeId) {
      where.packSizeId = packSizeId;
    } else if (packFormatId) {
      where.packSize = { packFormatId };
    } else if (brandId) {
      where.packSize = { packFormat: { brandId } };
    } else if (subCategoryId) {
      where.packSize = {
        packFormat: { brand: { subCategoryId } } };
    } else if (categoryId) {
      where.packSize = {
        packFormat: { brand: { subCategory: { categoryId } } } };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.sKU.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
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
      }),
      this.prisma.sKU.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSKUWithFullHierarchy(skuId: string) {
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
        _count: {
          select: {
            inventories: true,
            orderLines: true,
            vendorStocks: true,
          },
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    return sku;
  }

  async updateSKU(id: string, dto: UpdateSKUDto) {
    try {
      const updateData: any = { ...dto };

      // Recalculate price TTC if price HT or VAT rate changed
      if (dto.priceHt !== undefined || dto.vatRate !== undefined) {
        const sku = await this.prisma.sKU.findUnique({
          where: { id },
        });

        if (!sku) {
          throw new NotFoundException('SKU not found');
        }

        const priceHt = new Prisma.Decimal(dto.priceHt ?? sku.priceHt);
        const vatRate = new Prisma.Decimal(dto.vatRate ?? sku.vatRate);
        updateData.priceTtc = priceHt.mul(vatRate.div(100).add(1));
      }

      return await this.prisma.sKU.update({
        where: { id },
        data: updateData,
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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SKU not found');
      }
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('code')) {
          throw new ConflictException('SKU code already exists');
        }
        if (target?.includes('ean')) {
          throw new ConflictException('EAN already exists');
        }
        throw new ConflictException('SKU already exists');
      }
      throw error;
    }
  }

  async deleteSKU(id: string) {
    // Check if SKU has dependencies
    const [inventoryCount, orderCount, vendorStockCount] = await Promise.all([
      this.prisma.inventory.count({ where: { skuId: id } }),
      this.prisma.orderLine.count({ where: { skuId: id } }),
      this.prisma.vendorStock.count({ where: { skuId: id } }),
    ]);

    if (inventoryCount > 0 || orderCount > 0 || vendorStockCount > 0) {
      throw new BadRequestException(
        `Cannot delete SKU with dependencies. Found: ${inventoryCount} inventories, ${orderCount} orders, ${vendorStockCount} vendor stocks. Deactivate instead.`
      );
    }

    try {
      return await this.prisma.sKU.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SKU not found');
      }
      throw error;
    }
  }

  async toggleSKUStatus(id: string) {
    const sku = await this.prisma.sKU.findUnique({
      where: { id },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    return await this.prisma.sKU.update({
      where: { id },
      data: { active: !sku.active },
    });
  }

  // ========================================
  // HIERARCHY TREE
  // ========================================

  async getFullHierarchyTree() {
    const categories = await this.prisma.productCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategories: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            brands: {
              where: { active: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                subBrands: {
                  where: { active: true },
                  orderBy: { sortOrder: 'asc' },
                },
                packFormats: {
                  where: { active: true },
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    packSizes: {
                      where: { active: true },
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        _count: {
                          select: { skus: true },
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

    return categories;
  }

  async getProductStatistics() {
    const [
      categoriesCount,
      activeCategoriesCount,
      subCategoriesCount,
      activeSubCategoriesCount,
      brandsCount,
      activeBrandsCount,
      subBrandsCount,
      activeSubBrandsCount,
      packFormatsCount,
      activePackFormatsCount,
      packSizesCount,
      activePackSizesCount,
      skusCount,
      activeSkusCount,
    ] = await Promise.all([
      this.prisma.productCategory.count(),
      this.prisma.productCategory.count({ where: { active: true } }),
      this.prisma.productSubCategory.count(),
      this.prisma.productSubCategory.count({ where: { active: true } }),
      this.prisma.productBrand.count(),
      this.prisma.productBrand.count({ where: { active: true } }),
      this.prisma.productSubBrand.count(),
      this.prisma.productSubBrand.count({ where: { active: true } }),
      this.prisma.productPackFormat.count(),
      this.prisma.productPackFormat.count({ where: { active: true } }),
      this.prisma.productPackSize.count(),
      this.prisma.productPackSize.count({ where: { active: true } }),
      this.prisma.sKU.count(),
      this.prisma.sKU.count({ where: { active: true } }),
    ]);

    // Calculer les moyennes
    const averageSKUsPerCategory = categoriesCount > 0 ? skusCount / categoriesCount : 0;
    const averageSKUsPerBrand = brandsCount > 0 ? skusCount / brandsCount : 0;

    return {
      totalCategories: categoriesCount,
      activeCategories: activeCategoriesCount,
      totalSubCategories: subCategoriesCount,
      activeSubCategories: activeSubCategoriesCount,
      totalBrands: brandsCount,
      activeBrands: activeBrandsCount,
      totalSubBrands: subBrandsCount,
      activeSubBrands: activeSubBrandsCount,
      totalPackFormats: packFormatsCount,
      activePackFormats: activePackFormatsCount,
      totalPackSizes: packSizesCount,
      activePackSizes: activePackSizesCount,
      totalSKUs: skusCount,
      activeSKUs: activeSkusCount,
      averageSKUsPerCategory,
      averageSKUsPerBrand,
    };
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private async cascadeDeactivate(tx: any, id: string, level: string) {
    switch (level) {
      case 'category':
        // Deactivate all sub-categories
        const subCategories = await tx.productSubCategory.findMany({
          where: { categoryId: id },
        });
        for (const subCat of subCategories) {
          await tx.productSubCategory.update({
            where: { id: subCat.id },
            data: { active: false },
          });
          await this.cascadeDeactivate(tx, subCat.id, 'subCategory');
        }
        break;

      case 'subCategory':
        // Deactivate all brands
        const brands = await tx.productBrand.findMany({
          where: { subCategoryId: id },
        });
        
        for (const brand of brands) {
          await tx.productBrand.update({
            where: { id: brand.id },
            data: { active: false },
          });
          await this.cascadeDeactivate(tx, brand.id, 'brand');
        }
        break;

      case 'brand':
        // Deactivate all sub-brands
        const subBrands = await tx.productSubBrand.findMany({
          where: { brandId: id },
        });
        
        for (const subBrand of subBrands) {
          await tx.productSubBrand.update({
            where: { id: subBrand.id },
            data: { active: false },
          });
          await this.cascadeDeactivate(tx, subBrand.id, 'subBrand');
        }
        break;

      case 'subBrand':
        // Deactivate all pack formats
        const packFormats = await tx.productPackFormat.findMany({
          where: { subBrandId: id },
        });
        
        for (const packFormat of packFormats) {
          await tx.productPackFormat.update({
            where: { id: packFormat.id },
            data: { active: false },
          });
          await this.cascadeDeactivate(tx, packFormat.id, 'packFormat');
        }
        break;

      case 'packFormat':
        // Deactivate all pack sizes
        const packSizes = await tx.productPackSize.findMany({
          where: { packFormatId: id },
        });
        
        for (const packSize of packSizes) {
          await tx.productPackSize.update({
            where: { id: packSize.id },
            data: { active: false },
          });
          await this.cascadeDeactivate(tx, packSize.id, 'packSize');
        }
        break;

      case 'packSize':
        // Deactivate all SKUs
        await tx.sKU.updateMany({
          where: { packSizeId: id },
          data: { active: false },
        });
        break;
    }
  }
}
