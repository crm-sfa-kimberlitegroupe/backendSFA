import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMerchandisingDto,
  UpdateMerchandisingDto,
  AddPhotosDto,
} from './dto/merchandising.dto';

@Injectable()
export class MerchandisingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creer un nouveau merchandising pour une visite
   */
  async create(userId: string, dto: CreateMerchandisingDto) {
    console.log(
      '[MerchandisingService] Creation merchandising pour visite:',
      dto.visitId);

    // Verifier que la visite existe et appartient a l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: dto.visitId },
      include: { outlet: true },
    });

    if (!visit) {
      throw new NotFoundException('Visite non trouvee');
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a cette visite');
    }

    // Verifier que tous les SKUs existent
    if (dto.items && dto.items.length > 0) {
      const skuIds = dto.items.map((item) => item.skuId);
      const existingSKUs = await this.prisma.sKU.findMany({
        where: { id: { in: skuIds } },
        select: { id: true },
      });

      if (existingSKUs.length !== skuIds.length) {
        throw new BadRequestException(
          'Un ou plusieurs produits sont invalides',
        );
      }
    }

    // Calculer le score (pourcentage de reponses positives)
    let score = 0;
    if (dto.items && dto.items.length > 0) {
      const totalQuestions = dto.items.length * 3; // 3 questions par produit
      const positiveAnswers = dto.items.reduce((sum, item) => {
        return sum + 
          (item.isVisible ? 1 : 0) +
          (item.isPriceCorrect ? 1 : 0) +
          (item.isWellStocked ? 1 : 0);
      }, 0);
      score = Math.round((positiveAnswers / totalQuestions) * 100);
    }

    // Creer le merchandising avec les items et photos
    const merchCheck = await this.prisma.merchCheck.create({
      data: {
        visitId: dto.visitId,
        score,
        notes: dto.notes,
        merchItems: {
          create: dto.items.map((item) => ({
            skuId: item.skuId,
            isVisible: item.isVisible,
            isPriceCorrect: item.isPriceCorrect,
            isWellStocked: item.isWellStocked,
            comment: item.comment,
          })),
        },
        merchPhotos: dto.photos?.length
          ? {
              create: dto.photos.map((photo) => ({
                fileKey: photo.fileKey,
                takenAt: new Date(),
                lat: photo.lat,
                lng: photo.lng,
                meta: photo.meta as object | undefined,
              })),
            }
          : undefined,
      },
      include: {
        merchItems: {
          include: {
            sku: {
              select: {
                id: true,
                code: true,
                shortDescription: true,
                photo: true,
                priceTtc: true,
              },
            },
          },
        },
        merchPhotos: true,
        visit: {
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(
      '[MerchandisingService] Merchandising cree:',
      merchCheck.id,
      'Score:', score);
    return merchCheck;
  }

  /**
   * Recuperer un merchandising par ID
   */
  async findById(id: string, userId: string) {
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id },
      include: {
        merchItems: {
          include: {
            sku: {
              select: {
                id: true,
                code: true,
                shortDescription: true,
                fullDescription: true,
                photo: true,
                priceTtc: true,
              },
            },
          },
        },
        merchPhotos: true,
        visit: {
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!merchCheck) {
      throw new NotFoundException('Merchandising non trouve');
    }

    // Verifier l'acces
    if (merchCheck.visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a ce merchandising');
    }

    return merchCheck;
  }

  /**
   * Recuperer tous les merchandisings d'une visite
   */
  async findByVisit(visitId: string, userId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('Visite non trouvee');
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a cette visite');
    }

    return this.prisma.merchCheck.findMany({
      where: { visitId },
      include: {
        merchItems: {
          include: {
            sku: {
              select: {
                id: true,
                code: true,
                shortDescription: true,
                photo: true,
                priceTtc: true,
              },
            },
          },
        },
        merchPhotos: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mettre a jour un merchandising
   */
  async update(id: string, userId: string, dto: UpdateMerchandisingDto) {
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id },
      include: { visit: true },
    });

    if (!merchCheck) {
      throw new NotFoundException('Merchandising non trouve');
    }

    if (merchCheck.visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a ce merchandising');
    }

    // Calculer le nouveau score si des items sont fournis
    let score = merchCheck.score;
    if (dto.items && dto.items.length > 0) {
      const totalQuestions = dto.items.length * 3;
      const positiveAnswers = dto.items.reduce((sum, item) => {
        return sum + 
          (item.isVisible ? 1 : 0) +
          (item.isPriceCorrect ? 1 : 0) +
          (item.isWellStocked ? 1 : 0);
      }, 0);
      score = Math.round((positiveAnswers / totalQuestions) * 100);
    }

    // Transaction pour mise a jour atomique
    return this.prisma.$transaction(async (tx) => {
      // Supprimer les anciens items si de nouveaux sont fournis
      if (dto.items && dto.items.length > 0) {
        await tx.merchCheckItem.deleteMany({
          where: { merchCheckId: id },
        });
      }

      // Mettre a jour le merchandising
      return tx.merchCheck.update({
        where: { id },
        data: {
          notes: dto.notes !== undefined ? dto.notes : merchCheck.notes,
          score,
          merchItems: dto.items?.length
            ? {
                create: dto.items.map((item) => ({
                  skuId: item.skuId,
                  isVisible: item.isVisible,
                  isPriceCorrect: item.isPriceCorrect,
                  isWellStocked: item.isWellStocked,
                  comment: item.comment,
                })),
              }
            : undefined,
          merchPhotos: dto.photos?.length
            ? {
                create: dto.photos.map((photo) => ({
                  fileKey: photo.fileKey,
                  takenAt: new Date(),
                  lat: photo.lat,
                  lng: photo.lng,
                  meta: photo.meta as object | undefined,
                })),
              }
            : undefined,
        },
        include: {
          merchItems: {
            include: {
              sku: {
                select: {
                  id: true,
                  code: true,
                  shortDescription: true,
                  photo: true,
                  priceTtc: true,
                },
              },
            },
          },
          merchPhotos: true,
        },
      });
    });
  }

  /**
   * Ajouter des photos a un merchandising
   */
  async addPhotos(id: string, userId: string, dto: AddPhotosDto) {
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id },
      include: { visit: true },
    });

    if (!merchCheck) {
      throw new NotFoundException('Merchandising non trouve');
    }

    if (merchCheck.visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a ce merchandising');
    }

    // Ajouter les photos
    await this.prisma.merchPhoto.createMany({
      data: dto.photos.map((photo) => ({
        merchCheckId: id,
        fileKey: photo.fileKey,
        takenAt: new Date(),
        lat: photo.lat,
        lng: photo.lng,
        meta: photo.meta as object | undefined,
      })),
    });

    return this.findById(id, userId);
  }

  /**
   * Supprimer une photo
   */
  async deletePhoto(merchCheckId: string, photoId: string, userId: string) {
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id: merchCheckId },
      include: { visit: true },
    });

    if (!merchCheck) {
      throw new NotFoundException('Merchandising non trouve');
    }

    if (merchCheck.visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a ce merchandising');
    }

    await this.prisma.merchPhoto.delete({
      where: { id: photoId },
    });

    return { message: 'Photo supprimee avec succes' };
  }

  /**
   * Supprimer un merchandising
   */
  async delete(id: string, userId: string) {
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id },
      include: { visit: true },
    });

    if (!merchCheck) {
      throw new NotFoundException('Merchandising non trouve');
    }

    if (merchCheck.visit.userId !== userId) {
      throw new ForbiddenException('Vous n avez pas acces a ce merchandising');
    }

    await this.prisma.merchCheck.delete({
      where: { id },
    });

    return { message: 'Merchandising supprime avec succes' };
  }

  /**
   * Statistiques de merchandising pour un vendeur
   */
  async getStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = {
      visit: { userId },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = endDate;
      }
    }

    const merchChecks = await this.prisma.merchCheck.findMany({
      where,
      include: {
        merchItems: true,
      },
    });

    const totalChecks = merchChecks.length;
    const totalItems = merchChecks.reduce(
      (sum, mc) => sum + mc.merchItems.length,
      0,
    );
    const averageScore =
      totalChecks > 0
        ? Math.round(
            merchChecks.reduce((sum, mc) => sum + (mc.score || 0), 0) /
              totalChecks,
          )
        : 0;

    // Calculer les stats par critere
    let visibleCount = 0;
    let priceCorrectCount = 0;
    let wellStockedCount = 0;

    merchChecks.forEach((mc) => {
      mc.merchItems.forEach((item) => {
        if (item.isVisible) visibleCount++;
        if (item.isPriceCorrect) priceCorrectCount++;
        if (item.isWellStocked) wellStockedCount++;
      });
    });

    return {
      totalChecks,
      totalItems,
      averageScore,
      criteria: {
        visibility:
          totalItems > 0 ? Math.round((visibleCount / totalItems) * 100) : 0,
        priceCompliance:
          totalItems > 0
            ? Math.round((priceCorrectCount / totalItems) * 100)
            : 0,
        stockAvailability:
          totalItems > 0
            ? Math.round((wellStockedCount / totalItems) * 100)
            : 0,
      },
    };
  }

  /**
   * Recuperer les SKUs disponibles pour le merchandising (stock du vendeur)
   */
  async getAvailableSKUs(userId: string) {
    const vendorStocks = await this.prisma.vendorStock.findMany({
      where: {
        userId,
        quantity: { gt: 0 },
      },
      include: {
        sku: {
          select: {
            id: true,
            code: true,
            shortDescription: true,
            fullDescription: true,
            photo: true,
            priceTtc: true,
            packSize: {
              select: {
                name: true,
                packFormat: {
                  select: {
                    name: true,
                    brand: {
                      select: {
                        name: true,
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

    return vendorStocks.map((vs) => ({
      ...vs.sku,
      quantity: vs.quantity,
    }));
  }
}
