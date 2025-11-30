import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVisitDto,
  CreateCompleteVisitDto,
  CompleteVisitDto,
  CheckInDto,
  CheckOutDto,
  CreateMerchCheckDto,
} from './dto/create-visit.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une visite complète (check-in et check-out automatiques)
   */
  async createCompleteVisit(userId: string, data: CreateCompleteVisitDto) {
    console.log('🔍 [VisitsService] createCompleteVisit appelé avec:', { userId, data });
    const now = new Date();

    // Vérifier que l'outlet existe
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: data.outletId },
    });

    if (!outlet) {
      console.error('❌ [VisitsService] Outlet introuvable:', data.outletId);
      throw new NotFoundException(
        `Point de vente ${data.outletId} introuvable`,
      );
    }

    console.log('✅ [VisitsService] Outlet trouvé:', outlet.name);

    // Créer la visite avec transaction pour assurer la cohérence
    return await this.prisma.$transaction(async (tx) => {
      // Créer la visite avec check-in et check-out automatiques
      const visit = await tx.visit.create({
        data: {
          outletId: data.outletId,
          userId,
          checkinAt: now,
          checkinLat: data.checkinLat,
          checkinLng: data.checkinLng,
          checkoutAt: now, // Check-out automatique
          checkoutLat: data.checkinLat, // Utiliser les mêmes coordonnées
          checkoutLng: data.checkinLng,
          durationMin: 0, // Durée 0 car instantané
          notes: data.notes,
          score: data.score,
        },
        include: {
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

      // Si des données de merchandising sont fournies, créer le MerchCheck
      if (data.merchCheck) {
        const merchCheck = await tx.merchCheck.create({
          data: {
            visitId: visit.id,
            checklist: data.merchCheck.checklist as Prisma.JsonValue,
            planogram: data.merchCheck.planogram as Prisma.JsonValue,
            score: data.merchCheck.score,
          },
        });

        // Créer les photos de merchandising si fournies
        if (data.merchCheck.photos && data.merchCheck.photos.length > 0) {
          await tx.merchPhoto.createMany({
            data: data.merchCheck.photos.map((photo) => ({
              merchCheckId: merchCheck.id,
              fileKey: photo.fileKey,
              takenAt: now,
              lat: photo.lat,
              lng: photo.lng,
              meta: photo.meta as Prisma.JsonValue,
            })),
          });
        }
      }

      // Si un ordre ID est fourni, mettre à jour l'ordre avec l'ID de la visite
      if (data.orderId) {
        await tx.order.update({
          where: { id: data.orderId },
          data: { visitId: visit.id },
        });
      }

      console.log(' [VisitsService] Visite créée avec succès:', visit.id);
      return visit;
    });
  }

  /**
   * Check-in : Début d'une visite
   */
  async checkIn(userId: string, data: CheckInDto) {
    // Vérifier que l'outlet existe
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: data.outletId },
    });

    if (!outlet) {
      throw new NotFoundException(
        `Point de vente ${data.outletId} introuvable`,
      );
    }

    // Créer la visite avec check-in
    return await this.prisma.visit.create({
      data: {
        outletId: data.outletId,
        userId,
        checkinAt: new Date(),
        checkinLat: data.checkinLat,
        checkinLng: data.checkinLng,
        notes: data.notes,
      },
      include: {
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
  }

  /**
   * Check-out : Fin d'une visite
   */
  async checkOut(userId: string, data: CheckOutDto) { 
    // Récupérer la visite
    const visit = await this.prisma.visit.findUnique({
      where: { id: data.visitId },
      include: {
        outlet: true,
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${data.visitId} introuvable`);
    }

    // Vérifier que c'est bien l'utilisateur qui a créé la visite
    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas terminer une visite que vous n avez pas créée',
      );
    }

    // Vérifier que la visite n'est pas déjà terminée
    if (visit.checkoutAt) {
      throw new BadRequestException('Cette visite est déjà terminée');
    }

    // Calculer la durée en minutes
    const durationMin = Math.round(
      (new Date().getTime() - visit.checkinAt.getTime()) / 60000,
    );

    // Mettre à jour la visite avec check-out
    return await this.prisma.visit.update({
      where: { id: data.visitId },
      data: {
        checkoutAt: new Date(),
        checkoutLat: data.checkoutLat,
        checkoutLng: data.checkoutLng,
        durationMin,
        notes: data.notes || visit.notes,
        score: data.score,
      },
      include: {
        outlet: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        merchChecks: {
          include: {
            merchPhotos: true,
          },
        },
        orders: true,
      },
    });
  }

  /**
   * Mettre à jour le statut d'une visite
   */
  async updateVisitStatus(
    visitId: string,
    status: 'IN_PROGRESS' | 'COMPLETED',
    userId: string,
  ) {
    // Vérifier que la visite appartient bien à l'utilisateur
    const visit = await this.prisma.visit.findFirst({
      where: {
        id: visitId,
        userId,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visite non trouvée');
    }

    // Mettre à jour les timestamps selon le statut
    const updateData: any = {};

    if (status === 'IN_PROGRESS' && !visit.checkinAt) {
      updateData.checkinAt = new Date();
    }

    if (status === 'COMPLETED' && !visit.checkoutAt) {
      updateData.checkoutAt = new Date();
    }

    return await this.prisma.visit.update({
      where: { id: visitId },
      data: updateData,
      include: {
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
  }

  /**
   * Complète une visite existante avec les données finales
   */
  async completeExistingVisit(
    visitId: string,
    userId: string,
    data: CompleteVisitDto,
  ) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findFirst({
      where: {
        id: visitId,
        userId,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visite non trouvée');
    }

    // Mettre à jour la visite avec les données finales
    return await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        checkoutAt: new Date(),
        checkoutLat: data.checkoutLat,
        checkoutLng: data.checkoutLng,
        notes: data.notes || visit.notes,
        score: data.score,
        durationMin: Math.round(
          (new Date().getTime() - visit.checkinAt.getTime()) / 60000,
        ),
      },
      include: {
        outlet: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        merchChecks: {
          include: {
            merchPhotos: true,
          },
        },
        orders: true,
      },
    });
  }

  /**
   * Terminer une visite avec toutes les données (merchandising, vente)
   */
  async completeVisit(userId: string, data: CompleteVisitDto) {
    // Utiliser une transaction pour assurer la cohérence
    return await this.prisma.$transaction(async (tx) => {
      // Récupérer la visite
      const visit = await tx.visit.findUnique({
        where: { id: data.visitId },
      });

      if (!visit) {
        throw new NotFoundException(`Visite ${data.visitId} introuvable`);
      }

      // Vérifier que c'est bien l'utilisateur qui a créé la visite
      if (visit.userId !== userId) {
        throw new ForbiddenException(
          'Vous ne pouvez pas terminer une visite que vous n avez pas créée',
        );
      }

      // Vérifier que la visite n'est pas déjà terminée
      if (visit.checkoutAt) {
        throw new BadRequestException('Cette visite est déjà terminée');
      }

      // Calculer la durée en minutes
      const durationMin = Math.round(
        (new Date().getTime() - visit.checkinAt.getTime()) / 60000,
      );

      // Mettre à jour la visite avec check-out
      await tx.visit.update({
        where: { id: data.visitId },
        data: {
          checkoutAt: new Date(),
          checkoutLat: data.checkoutLat,
          checkoutLng: data.checkoutLng,
          durationMin,
          notes: data.notes || visit.notes,
          score: data.score,
        },
      });

      // Si des données de merchandising sont fournies, créer le MerchCheck
      if (data.merchCheck) {
        const merchCheck = await tx.merchCheck.create({
          data: {
            visitId: visit.id,
            checklist: data.merchCheck.checklist as Prisma.JsonValue,
            planogram: data.merchCheck.planogram as Prisma.JsonValue,
            score: data.merchCheck.score,
          },
        });

        // Créer les photos de merchandising si fournies
        if (data.merchCheck.photos && data.merchCheck.photos.length > 0) {
          await tx.merchPhoto.createMany({
            data: data.merchCheck.photos.map((photo) => ({
              merchCheckId: merchCheck.id,
              fileKey: photo.fileKey,
              takenAt: new Date(),
              lat: photo.lat,
              lng: photo.lng,
              meta: photo.meta as Prisma.JsonValue,
            })),
          });
        }
      }

      // Si un order ID est fourni, mettre à jour l'order avec l'ID de la visite
      if (data.orderId) {
        await tx.order.update({
          where: { id: data.orderId },
          data: { visitId: visit.id },
        });
      }

      // Retourner la visite complète avec toutes les relations
      return await tx.visit.findUnique({
        where: { id: visit.id },
        include: {
          outlet: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          merchChecks: {
            include: {
              merchPhotos: true,
            },
          },
          orders: {
            include: {
              orderLines: {
                include: {
                  sku: true,
                },
              },
              payments: true,
            },
          },
        },
      });
    });
  }

  /**
   * Récupérer les visites d'un utilisateur
   */
  async getUserVisits(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      outletId?: string;
    },
  ) {
    const where: Prisma.VisitWhereInput = {
      userId,
    };

    if (filters?.startDate || filters?.endDate) {
      where.checkinAt = {};
      if (filters.startDate) {
        where.checkinAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.checkinAt.lte = filters.endDate;
      }
    }

    if (filters?.outletId) {
      where.outletId = filters.outletId;
    }

    return await this.prisma.visit.findMany({
      where,
      include: {
        outlet: true,
        merchChecks: {
          include: {
            merchPhotos: true,
          },
        },
        orders: {
          include: {
            orderLines: {
              include: {
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkinAt: 'desc',
      },
    });
  }

  /**
   * Récupérer une visite par ID
   */
  async getVisitById(visitId: string, userId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        outlet: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        merchChecks: {
          include: {
            merchPhotos: true,
          },
        },
        orders: {
          include: {
            orderLines: {
              include: {
                sku: true,
              },
            },
            payments: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    // Vérifier que l'utilisateur a le droit de voir cette visite
    // (soit c'est sa visite, soit c'est un admin/superviseur)
    // TODO: Ajouter la vérification des rôles

    return visit;
  }

  /**
   * Récupérer la dernière visite d'un PDV (par outletId)
   */
  async getLatestVisitByOutlet(outletId: string, userId: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { 
        outletId,
        userId, // Seulement les visites de cet utilisateur
      },
      orderBy: { checkinAt: 'desc' }, // La plus récente d'abord
      include: {
        outlet: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        merchChecks: {
          include: {
            merchPhotos: true,
          },
        },
        orders: {
          include: {
            orderLines: {
              include: {
                sku: true,
              },
            },
            payments: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Aucune visite trouvée pour le PDV ${outletId}`);
    }

    return visit;
  }

  /**
   * Ajouter un merchandising à une visite existante
   * Supporte le nouveau format avec questions et notes
   */
  async addMerchCheck(
    visitId: string,
    userId: string,
    data: CreateMerchCheckDto,
  ) {
    // Verifier que la visite existe et appartient a l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        "Vous ne pouvez pas ajouter un merchandising a une visite que vous n'avez pas creee",
      );
    }

    // Calculer le score automatiquement si des questions sont fournies
    let calculatedScore = data.score;
    if (data.questions && data.questions.length > 0) {
      const totalRating = data.questions.reduce((sum, q) => sum + q.rating, 0);
      const maxPossible = data.questions.length * 5; // Note max = 5
      calculatedScore = Math.round((totalRating / maxPossible) * 100);
    }

    // Preparer les donnees de la checklist (combiner ancien et nouveau format)
    const checklistData = {
      // Ancien format si fourni
      ...data.checklist,
      // Nouveau format: questions avec notes
      questions: data.questions?.map((q) => ({
        questionId: q.questionId,
        question: q.question,
        rating: q.rating,
        comment: q.comment || null,
      })) || [],
      // Notes generales
      notes: data.notes || null,
    };

    // Creer le MerchCheck
    const merchCheck = await this.prisma.merchCheck.create({
      data: {
        visitId,
        checklist: checklistData as unknown as Prisma.JsonValue,
        planogram: data.planogram as Prisma.JsonValue,
        score: calculatedScore,
      },
    });

    // Creer les photos si fournies
    if (data.photos && data.photos.length > 0) {
      await this.prisma.merchPhoto.createMany({
        data: data.photos.map((photo) => ({
          merchCheckId: merchCheck.id,
          fileKey: photo.fileKey,
          takenAt: new Date(),
          lat: photo.lat,
          lng: photo.lng,
          meta: photo.meta as Prisma.JsonValue,
        })),
      });
    }

    // Retourner le merchCheck avec les photos
    return await this.prisma.merchCheck.findUnique({
      where: { id: merchCheck.id },
      include: {
        merchPhotos: true,
      },
    });
  }

  /**
   * Lier une vente à une visite
   */
  async linkOrderToVisit(visitId: string, orderId: string, userId: string) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas lier une vente à une visite que vous n avez pas créée',
      );
    }

    // Vérifier que l'ordre existe et appartient à l'utilisateur
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Commande ${orderId} introuvable`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas lier une vente qui ne vous appartient pas',
      );
    }

    // Lier l'ordre à la visite
    return await this.prisma.order.update({
      where: { id: orderId },
      data: { visitId },
    });
  }

  /**
   * Mettre à jour toutes les ventes d'une visite
   */
  async updateVisitOrders(
    visitId: string,
    orderIds: string[],
    userId: string,
  ) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier une visite que vous n avez pas créée',
      );
    }

    // Vérifier que toutes les ventes existent et appartiennent à l'utilisateur
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId,
      },
    });

    if (orders.length !== orderIds.length) {
      throw new NotFoundException(
        'Une ou plusieurs ventes sont introuvables ou ne vous appartiennent pas',
      );
    }

    // Mettre à jour toutes les ventes pour les lier à la visite
    await this.prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        visitId,
      },
    });

    // Retourner la visite avec les ventes
    return await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        orders: true,
        merchChecks: true,
      },
    });
  }

  /**
   * Ajouter une vente à une visite
   */
  async addOrderToVisit(visitId: string, orderId: string, userId: string) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier une visite que vous n avez pas créée',
      );
    }

    // Vérifier que la vente existe et appartient à l'utilisateur
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Vente ${orderId} introuvable`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas ajouter une vente qui ne vous appartient pas',
      );
    }

    // Lier la vente à la visite
    await this.prisma.order.update({
      where: { id: orderId },
      data: { visitId },
    });

    // Retourner la visite avec les ventes
    return await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        orders: true,
        merchChecks: true,
      },
    });
  }

  /**
   * Supprimer une vente d'une visite
   */
  async removeOrderFromVisit(
    visitId: string,
    orderId: string,
    userId: string,
  ) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier une visite que vous n avez pas créée',
      );
    }

    // Vérifier que la vente existe
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Vente ${orderId} introuvable`);
    }

    // Délier la vente de la visite
    await this.prisma.order.update({
      where: { id: orderId },
      data: { visitId: null },
    });

    // Retourner la visite avec les ventes
    return await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        orders: true,
        merchChecks: true,
      },
    });
  }

  /**
   * Mettre à jour tous les merchandising d'une visite
   */
  async updateVisitMerchandising(
    visitId: string,
    merchIds: string[],
    userId: string,
  ) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier une visite que vous n avez pas créée',
      );
    }

    // Vérifier que tous les merchandising existent et appartiennent à la visite
    const merchChecks = await this.prisma.merchCheck.findMany({
      where: {
        id: { in: merchIds },
        visitId,
      },
    });

    if (merchChecks.length !== merchIds.length) {
      throw new NotFoundException(
        'Un ou plusieurs merchandising sont introuvables ou n appartiennent pas à cette visite',
      );
    }

    // Retourner la visite avec les merchandising
    return await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        orders: true,
        merchChecks: true,
      },
    });
  }

  /**
   * Ajouter un merchandising à une visite
   */
  async addMerchandisingToVisit(
    visitId: string,
    merchId: string,
    userId: string,
  ) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier une visite que vous n avez pas créée',
      );
    }

    // Vérifier que le merchandising existe
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id: merchId },
    });

    if (!merchCheck) {
      throw new NotFoundException(`Merchandising ${merchId} introuvable`);
    }

    // Vérifier que le merchandising appartient à la visite
    if (merchCheck.visitId !== visitId) {
      throw new ForbiddenException(
        'Ce merchandising n appartient pas à cette visite',
      );
    }

    // Retourner la visite avec les merchandising
    return await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        orders: true,
        merchChecks: true,
      },
    });
  }

  /**
   * Supprimer un merchandising d'une visite
   */
  async removeMerchandisingFromVisit(
    visitId: string,
    merchId: string,
    userId: string,
  ) {
    // Vérifier que la visite existe et appartient à l'utilisateur
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visite ${visitId} introuvable`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier une visite que vous n avez pas créée',
      );
    }

    // Vérifier que le merchandising existe
    const merchCheck = await this.prisma.merchCheck.findUnique({
      where: { id: merchId },
    });

    if (!merchCheck) {
      throw new NotFoundException(`Merchandising ${merchId} introuvable`);
    }

    // Supprimer le merchandising
    await this.prisma.merchCheck.delete({
      where: { id: merchId },
    });

    // Retourner la visite avec les merchandising restants
    return await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        orders: true,
        merchChecks: true,
      },
    });
  }
}
