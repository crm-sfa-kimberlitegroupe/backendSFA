import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { AssignOutletsToSectorDto } from './dto/assign-outlets-to-sector.dto';
import { AssignSectorToVendorDto } from './dto/assign-sector-to-vendor.dto';
import { AssignOutletsToVendorDto } from './dto/assign-outlets-to-vendor.dto';
import { RemoveOutletsFromSectorDto } from './dto/remove-outlets-from-sector.dto';
import { RoleEnum, TerritoryLevelEnum as TerritoryLevel } from '@prisma/client';

export interface Territory {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les territoires avec toutes leurs informations enrichies
   */
  async findAll(): Promise<any[]> {
    const territories = await this.prisma.territory.findMany({
      select: {
        // Champs de base
        id: true,
        code: true,
        name: true,
        level: true,
        parentId: true,

        // Informations géographiques
        region: true,
        commune: true,
        ville: true,
        quartier: true,
        codePostal: true,
        lat: true,
        lng: true,

        // Informations démographiques
        population: true,
        superficie: true,
        densitePopulation: true,

        // Informations commerciales
        potentielCommercial: true,
        categorieMarche: true,
        typeZone: true,
        nombrePDVEstime: true,
        tauxPenetration: true,

        // Métadonnées
        adminId: true,
        createdBy: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        // Relations
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        children: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
          },
        },
        outletsSector: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return territories;
  }

  /**
   * Créer un nouveau territoire (ZONE)
   */
  async createTerritory(data: any) {
    const { code, name } = data;

    // Vérifier que le code n'existe pas déjà
    const existingTerritory = await this.prisma.territory.findUnique({
      where: { code },
    });

    if (existingTerritory) {
      throw new BadRequestException(
        `Un territoire avec le code ${code} existe déjà`,
      );
    }

    // Calculer la densité si population et superficie sont fournis
    let densitePopulation: number | null = null;
    if (data.population && data.superficie) {
      densitePopulation = data.population / data.superficie;
    }

    // Créer le territoire
    const territory = await this.prisma.territory.create({
      data: {
        code,
        name,
        level: TerritoryLevel.ZONE,
        region: data.region || null,
        commune: data.commune || null,
        ville: data.ville || null,
        quartier: data.quartier || null,
        codePostal: data.codePostal || null,
        lat: data.lat || null,
        lng: data.lng || null,
        population: data.population || null,
        superficie: data.superficie || null,
        densitePopulation,
        potentielCommercial: data.potentielCommercial || null,
        categorieMarche: data.categorieMarche || null,
        typeZone: data.typeZone || null,
        nombrePDVEstime: data.nombrePDVEstime || null,
        tauxPenetration: data.tauxPenetration || null,
        notes: data.notes || null,
        isActive: true,
      },
    });

    return territory;
  }

  /**
   * Mettre à jour un territoire
   */
  async updateTerritory(id: string, data: any) {
    // Vérifier que le territoire existe
    const existingTerritory = await this.prisma.territory.findUnique({
      where: { id },
    });

    if (!existingTerritory) {
      throw new NotFoundException(`Territoire avec l'ID ${id} introuvable`);
    }

    // Calculer la densité si population et superficie sont fournis
    let densitePopulation = existingTerritory.densitePopulation;
    if (data.population && data.superficie) {
      densitePopulation = data.population / data.superficie;
    }

    // Mettre à jour le territoire
    const territory = await this.prisma.territory.update({
      where: { id },
      data: {
        name: data.name || existingTerritory.name,
        region: data.region !== undefined ? data.region : existingTerritory.region,
        commune: data.commune !== undefined ? data.commune : existingTerritory.commune,
        ville: data.ville !== undefined ? data.ville : existingTerritory.ville,
        quartier: data.quartier !== undefined ? data.quartier : existingTerritory.quartier,
        codePostal: data.codePostal !== undefined ? data.codePostal : existingTerritory.codePostal,
        lat: data.lat !== undefined ? data.lat : existingTerritory.lat,
        lng: data.lng !== undefined ? data.lng : existingTerritory.lng,
        population: data.population !== undefined ? data.population : existingTerritory.population,
        superficie: data.superficie !== undefined ? data.superficie : existingTerritory.superficie,
        densitePopulation,
        potentielCommercial: data.potentielCommercial !== undefined ? data.potentielCommercial : existingTerritory.potentielCommercial,
        categorieMarche: data.categorieMarche !== undefined ? data.categorieMarche : existingTerritory.categorieMarche,
        typeZone: data.typeZone !== undefined ? data.typeZone : existingTerritory.typeZone,
        nombrePDVEstime: data.nombrePDVEstime !== undefined ? data.nombrePDVEstime : existingTerritory.nombrePDVEstime,
        tauxPenetration: data.tauxPenetration !== undefined ? data.tauxPenetration : existingTerritory.tauxPenetration,
        notes: data.notes !== undefined ? data.notes : existingTerritory.notes,
      },
    });

    return territory;
  }

  /**
   * Supprimer un territoire
   */
  async deleteTerritory(id: string) {
    // Vérifier que le territoire existe
    const existingTerritory = await this.prisma.territory.findUnique({
      where: { id },
    });

    if (!existingTerritory) {
      throw new NotFoundException(`Territoire avec l'ID ${id} introuvable`);
    }

    // Supprimer le territoire
    await this.prisma.territory.delete({
      where: { id },
    });
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
        level: (level as TerritoryLevel) || TerritoryLevel.SECTEUR,
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
      where.level = TerritoryLevel.SECTEUR;
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
  async removeOutletsFromSector(dto: RemoveOutletsFromSectorDto) {
    const { sectorId, outletIds } = dto;

    // Vérifier que le secteur existe
    await this.findSectorById(sectorId);

    // Mettre à jour les PDV en retirant le sectorId
    const result = await this.prisma.outlet.updateMany({
      where: {
        id: { in: outletIds },
        sectorId: sectorId,
      },
      data: {
        sectorId: null,
      },
    });

    return {
      success: true,
      removedCount: result.count,
      message: `${result.count} PDV retirés du secteur avec succès`,
    };
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

  /**
   * Assigner des PDV directement à un vendeur (via son secteur assigné)
   * Le vendeur doit déjà avoir un secteur assigné
   */
  async assignOutletsToVendor(dto: AssignOutletsToVendorDto) {
    const { vendorId, outletIds } = dto;

    // Vérifier que le vendeur existe et a un secteur assigné
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedSectorId: true,
        territoryId: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendeur avec l'ID ${vendorId} introuvable`);
    }

    if (vendor.role !== RoleEnum.REP) {
      throw new BadRequestException(
        'Seuls les vendeurs (REP) peuvent se voir assigner des PDV',
      );
    }

    if (!vendor.assignedSectorId) {
      throw new BadRequestException(
        `Le vendeur ${vendor.firstName} ${vendor.lastName} n'a pas de secteur assigné`,
      );
    }

    // Vérifier que tous les PDV existent et sont dans le territoire du vendeur
    const outlets = await this.prisma.outlet.findMany({
      where: {
        id: { in: outletIds },
      },
      select: {
        id: true,
        code: true,
        name: true,
        territoryId: true,
        sectorId: true,
      },
    });

    if (outlets.length !== outletIds.length) {
      throw new BadRequestException('Certains PDV n\'existent pas');
    }

    // Vérifier que tous les PDV sont dans le même territoire que le vendeur
    const invalidOutlets = outlets.filter(
      (outlet) => outlet.territoryId !== vendor.territoryId,
    );

    if (invalidOutlets.length > 0) {
      throw new BadRequestException(
        `Les PDV suivants ne sont pas dans le même territoire que le vendeur: ${invalidOutlets.map((o) => o.code).join(', ')}`,
      );
    }

    // Assigner les PDV au secteur du vendeur
    const result = await this.prisma.outlet.updateMany({
      where: {
        id: { in: outletIds },
      },
      data: {
        sectorId: vendor.assignedSectorId,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      assignedCount: result.count,
      vendor: {
        id: vendor.id,
        name: `${vendor.firstName} ${vendor.lastName}`,
      },
      sector: {
        id: vendor.assignedSectorId,
      },
      message: `${result.count} PDV assignés au vendeur avec succès`,
    };
  }

  /**
   * Retirer un vendeur d'un secteur (désassigner)
   */
  async removeSectorFromVendor(vendorId: string) {
    // Vérifier que le vendeur existe
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedSectorId: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendeur avec l'ID ${vendorId} introuvable`);
    }

    if (vendor.role !== RoleEnum.REP) {
      throw new BadRequestException(
        'Seuls les vendeurs (REP) ont des secteurs assignés',
      );
    }

    if (!vendor.assignedSectorId) {
      throw new BadRequestException(
        `Le vendeur ${vendor.firstName} ${vendor.lastName} n'a pas de secteur assigné`,
      );
    }

    // Désassigner le secteur du vendeur
    await this.prisma.user.update({
      where: { id: vendorId },
      data: {
        assignedSectorId: null,
      },
    });

    return {
      success: true,
      message: `Secteur retiré du vendeur ${vendor.firstName} ${vendor.lastName} avec succès`,
    };
  }

  /**
   * Récupérer tous les vendeurs avec leurs secteurs assignés
   */
  async findAllVendorsWithSectors() {
    const vendors = await this.prisma.user.findMany({
      where: {
        role: RoleEnum.REP,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        territoryId: true,
        assignedSectorId: true,
        territory: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedSector: {
          select: {
            id: true,
            code: true,
            name: true,
            outletsSector: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return vendors;
  }
}

