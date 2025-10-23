import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { AssignOutletsToSectorDto } from './dto/assign-outlets-to-sector.dto';
import { AssignSectorToVendorDto } from './dto/assign-sector-to-vendor.dto';
import { RoleEnum } from '@prisma/client';

export interface Territory {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les territoires
   */
  async findAll(): Promise<Territory[]> {
    const territories = await this.prisma.territory.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return territories;
  }

  /**
   * Créer un nouveau secteur (zone)
   * Un secteur est un territoire de niveau SECTEUR
   */
  async createSector(createSectorDto: CreateSectorDto) {
    const { code, name, level, parentId } = createSectorDto;

    // Vérifier que le code n'existe pas déjà
    const existingSector = await this.prisma.territory.findUnique({
      where: { code },
    });

    if (existingSector) {
      throw new BadRequestException(
        `Un secteur avec le code ${code} existe déjà`,
      );
    }

    // Créer le secteur
    const sector = await this.prisma.territory.create({
      data: {
        code,
        name,
        level: level || 'SECTEUR',
        parentId: parentId || null,
      },
      include: {
        parent: true,
        outletsSector: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return sector;
  }

  /**
   * Récupérer tous les secteurs avec leurs PDV et vendeurs assignés
   */
  async findAllSectors(filters?: { level?: string }) {
    const where: any = {};

    if (filters?.level) {
      where.level = filters.level;
    } else {
      // Par défaut, récupérer uniquement les SECTEUR
      where.level = 'SECTEUR';
    }

    const sectors = await this.prisma.territory.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        outletsSector: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
            status: true,
          },
        },
        assignedUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return sectors;
  }

  /**
   * Récupérer un secteur par ID
   */
  async findSectorById(id: string) {
    const sector = await this.prisma.territory.findUnique({
      where: { id },
      include: {
        parent: true,
        outletsSector: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
            status: true,
            channel: true,
            segment: true,
          },
        },
        assignedUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!sector) {
      throw new NotFoundException(`Secteur avec l'ID ${id} introuvable`);
    }

    return sector;
  }

  /**
   * Assigner des points de vente à un secteur
   */
  async assignOutletsToSector(dto: AssignOutletsToSectorDto) {
    const { sectorId, outletIds } = dto;

    // Vérifier que le secteur existe
    const sector = await this.findSectorById(sectorId);

    // Mettre à jour les PDV avec le sectorId
    await this.prisma.outlet.updateMany({
      where: {
        id: { in: outletIds },
      },
      data: {
        sectorId: sectorId,
      },
    });

    // Récupérer le secteur mis à jour
    return this.findSectorById(sectorId);
  }

  /**
   * Retirer des points de vente d'un secteur
   */
  async removeOutletsFromSector(sectorId: string, outletIds: string[]) {
    // Vérifier que le secteur existe
    await this.findSectorById(sectorId);

    // Mettre à jour les PDV en retirant le sectorId
    await this.prisma.outlet.updateMany({
      where: {
        id: { in: outletIds },
        sectorId: sectorId,
      },
      data: {
        sectorId: null,
      },
    });

    return this.findSectorById(sectorId);
  }

  /**
   * Assigner un secteur à un vendeur
   */
  async assignSectorToVendor(dto: AssignSectorToVendorDto) {
    const { vendorId, sectorId } = dto;

    // Vérifier que le secteur existe
    await this.findSectorById(sectorId);

    // Vérifier que le vendeur existe et a le rôle REP
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendeur avec l'ID ${vendorId} introuvable`);
    }

    if (vendor.role !== RoleEnum.REP) {
      throw new BadRequestException(
        'Seuls les vendeurs (REP) peuvent être assignés à un secteur',
      );
    }

    // Assigner le secteur au vendeur
    await this.prisma.user.update({
      where: { id: vendorId },
      data: {
        assignedSectorId: sectorId,
      },
    });

    // Retourner le vendeur mis à jour
    return this.prisma.user.findUnique({
      where: { id: vendorId },
      include: {
        assignedSector: {
          include: {
            outletsSector: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Récupérer les PDV d'un vendeur via son secteur assigné
   */
  async getVendorOutlets(vendorId: string) {
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: {
        assignedSector: {
          include: {
            outletsSector: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
                status: true,
                channel: true,
                segment: true,
              },
            },
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendeur avec l'ID ${vendorId} introuvable`);
    }

    if (!vendor.assignedSector) {
      return {
        vendor: {
          id: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          email: vendor.email,
        },
        sector: null,
        outlets: [],
      };
    }

    return {
      vendor: {
        id: vendor.id,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
      },
      sector: {
        id: vendor.assignedSector.id,
        code: vendor.assignedSector.code,
        name: vendor.assignedSector.name,
      },
      outlets: vendor.assignedSector.outletsSector || [],
    };
  }

  /**
   * Supprimer un secteur
   */
  async removeSector(id: string) {
    // Vérifier que le secteur existe
    await this.findSectorById(id);

    // Vérifier qu'aucun PDV n'est assigné au secteur
    const outletsCount = await this.prisma.outlet.count({
      where: { sectorId: id },
    });

    if (outletsCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer le secteur car ${outletsCount} PDV y sont assignés`,
      );
    }

    // Vérifier qu'aucun vendeur n'est assigné au secteur
    const vendorsCount = await this.prisma.user.count({
      where: { assignedSectorId: id },
    });

    if (vendorsCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer le secteur car ${vendorsCount} vendeur(s) y sont assignés`,
      );
    }

    // Supprimer le secteur
    await this.prisma.territory.delete({
      where: { id },
    });

    return { message: 'Secteur supprimé avec succès' };
  }
}
