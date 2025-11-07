import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSKUDto {
  ean: string;
  name: string;
  brand: string;
  category?: string;
  description?: string;
  photo?: string;
  priceHt: number;
  vatRate: number;
  active?: boolean;
}

export interface UpdateSKUDto {
  ean?: string;
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  photo?: string;
  priceHt?: number;
  vatRate?: number;
  active?: boolean;
}

export interface SKUFilters {
  category?: string;
  brand?: string;
  active?: boolean;
  search?: string;
}

@Injectable()
export class SKUsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: SKUFilters) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.brand) {
      where.brand = filters.brand;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { ean: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skus = await this.prisma.sKU.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return skus;
  }

  async findOne(id: string) {
    const sku = await this.prisma.sKU.findUnique({
      where: { id },
    });

    if (!sku) {
      throw new NotFoundException(`SKU avec l'ID ${id} introuvable`);
    }

    return sku;
  }

  async findByEan(ean: string) {
    const sku = await this.prisma.sKU.findUnique({
      where: { ean },
    });

    if (!sku) {
      throw new NotFoundException(`SKU avec l'EAN ${ean} introuvable`);
    }

    return sku;
  }

  async create(data: CreateSKUDto) {
    const existingEan = await this.prisma.sKU.findUnique({
      where: { ean: data.ean },
    });

    if (existingEan) {
      throw new ConflictException(`Un SKU avec l'EAN ${data.ean} existe déjà`);
    }

    if (data.priceHt <= 0) {
      throw new BadRequestException('Le prix HT doit être supérieur à 0');
    }

    const sku = await this.prisma.sKU.create({
      data,
    });

    return sku;
  }

  async update(id: string, data: UpdateSKUDto) {
    await this.findOne(id);

    if (data.ean) {
      const existingEan = await this.prisma.sKU.findFirst({
        where: {
          ean: data.ean,
          NOT: { id },
        },
      });

      if (existingEan) {
        throw new ConflictException(`Un SKU avec l'EAN ${data.ean} existe déjà`);
      }
    }

    if (data.priceHt !== undefined && data.priceHt <= 0) {
      throw new BadRequestException('Le prix HT doit être supérieur à 0');
    }

    const sku = await this.prisma.sKU.update({
      where: { id },
      data,
    });

    return sku;
  }

  async toggleActive(id: string) {
    const sku = await this.findOne(id);

    return this.prisma.sKU.update({
      where: { id },
      data: {
        active: !sku.active,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.sKU.delete({
      where: { id },
    });

    return { message: 'SKU supprimé avec succès' };
  }

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.sKU.count(),
      this.prisma.sKU.count({ where: { active: true } }),
      this.prisma.sKU.count({ where: { active: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }

  async getCategories() {
    const skus = await this.prisma.sKU.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return skus.map(s => s.category).filter(Boolean);
  }

  async getBrands() {
    const skus = await this.prisma.sKU.findMany({
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });

    return skus.map(s => s.brand);
  }
}
