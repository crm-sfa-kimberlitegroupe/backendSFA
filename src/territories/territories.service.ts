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

export interface TerritoryGeoInfo {
  regions: string[];
  communes: string[];
  villes: string[];
  quartiers: string[];
  codesPostaux: string[];
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
        regions: true,
        communes: true,
        villes: true,
        quartiers: true,
        codesPostaux: true,
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
   * Récupérer un territoire par son ID
   */
  async findOne(id: string) {
    const territory = await this.prisma.territory.findUnique({
      where: { id },
      select: {
        // Champs de base
        id: true,
        code: true,
        name: true,
        level: true,
        parentId: true,

        // Informations géographiques
        regions: true,
        communes: true,
        villes: true,
        quartiers: true,
        codesPostaux: true,
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
      },
    });

    if (!territory) {
      throw new NotFoundException(`Territoire avec l'ID ${id} non trouvé`);
    }

    return territory;
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

    // Si un adminId est fourni, vérifier qu'il existe et qu'il est ADMIN
    if (data.adminId) {
      const admin = await this.prisma.user.findUnique({
        where: { id: data.adminId },
      });

      if (!admin) {
        throw new NotFoundException(
          `Administrateur avec l'ID ${data.adminId} introuvable`,
        );
      }

      if (admin.role !== 'ADMIN') {
        throw new BadRequestException(
          'Seul un utilisateur avec le rôle ADMIN peut être assigné à un territoire',
        );
      }

      // Vérifier que l'admin n'a pas déjà un territoire assigné
      const existingAssignment = await this.prisma.territory.findFirst({
        where: { adminId: data.adminId },
      });

      if (existingAssignment) {
        throw new BadRequestException(
          `Cet administrateur gère déjà le territoire "${existingAssignment.name}"`,
        );
      }
    }

    // Créer le territoire
    const territory = await this.prisma.territory.create({
      data: {
        code,
        name,
        level: TerritoryLevel.ZONE,
        adminId: data.adminId || null,
        regions: data.regions || [],
        communes: data.communes || [],
        villes: data.villes || [],
        quartiers: data.quartiers || [],
        codesPostaux: data.codesPostaux || [],
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
        regions: data.regions !== undefined ? data.regions : existingTerritory.regions,
        communes: data.communes !== undefined ? data.communes : existingTerritory.communes,
        villes: data.villes !== undefined ? data.villes : existingTerritory.villes,
        quartiers: data.quartiers !== undefined ? data.quartiers : existingTerritory.quartiers,
        codesPostaux: data.codesPostaux !== undefined ? data.codesPostaux : existingTerritory.codesPostaux,
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
    const { code, name, level, parentId, createdBy } = createSectorDto;

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
        createdBy: createdBy || null, // ID de l'admin créateur
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
      throw new BadRequestException("Certains PDV n'existent pas");
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
   * Récupérer le secteur assigné à un vendeur
   */
  async getVendorAssignedSector(vendorId: string) {
    const sector = await this.prisma.territory.findFirst({
      where: {
        level: 'SECTEUR',
        assignedUsers: {
          some: {
            id: vendorId,
          },
        },
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        outletsSector: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            lat: true,
            lng: true,
          },
        },
        assignedUsers: {
          where: {
            id: vendorId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!sector) {
      throw new NotFoundException('Aucun secteur assigné à ce vendeur');
    }

    return {
      success: true,
      data: sector,
      message: 'Secteur assigné récupéré avec succès',
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

  /**
   * Récupérer les informations géographiques d'un territoire
   * Retourne toutes les valeurs géographiques uniques du territoire et de ses enfants
   */
  async getTerritoryGeoInfo(territoryId: string): Promise<TerritoryGeoInfo> {
    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
      select: {
        regions: true,
        communes: true,
        villes: true,
        quartiers: true,
        codesPostaux: true,
        children: {
          select: {
            regions: true,
            communes: true,
            villes: true,
            quartiers: true,
            codesPostaux: true,
          },
        },
      },
    });

    if (!territory) {
      throw new NotFoundException(`Territoire ${territoryId} introuvable`);
    }

    // Extraire toutes les valeurs uniques (territoire parent + enfants)
    const allTerritories = [territory, ...territory.children];

    // Combiner tous les tableaux et garder les valeurs uniques
    const regions = [
      ...new Set(allTerritories.flatMap((t) => t.regions)),
    ].sort();
    const communes = [
      ...new Set(allTerritories.flatMap((t) => t.communes)),
    ].sort();
    const villes = [...new Set(allTerritories.flatMap((t) => t.villes))].sort();
    const quartiers = [
      ...new Set(allTerritories.flatMap((t) => t.quartiers)),
    ].sort();
    const codesPostaux = [
      ...new Set(allTerritories.flatMap((t) => t.codesPostaux)),
    ].sort();

    return {
      regions,
      communes,
      villes,
      quartiers,
      codesPostaux,
    };
  }

  /**
   * Assigner un admin à un territoire (première assignation)
   */
  async assignTerritoryAdmin(territoryId: string, adminId: string) {
    // Vérifier que le territoire existe
    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
    });

    if (!territory) {
      throw new NotFoundException(
        `Territoire avec l'ID ${territoryId} introuvable`,
      );
    }

    // Vérifier que le territoire n'a pas déjà un admin
    if (territory.adminId) {
      throw new BadRequestException(
        `Ce territoire a déjà un administrateur assigné. Utilisez la réassignation.`,
      );
    }

    // Vérifier que l'admin existe et a le bon rôle
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException(
        `Administrateur avec l'ID ${adminId} introuvable`,
      );
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestException(
        'Seul un utilisateur avec le rôle ADMIN peut être assigné à un territoire',
      );
    }

    // Vérifier que l'admin n'a pas déjà un territoire
    const existingAssignment = await this.prisma.territory.findFirst({
      where: { adminId },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `Cet administrateur gère déjà le territoire "${existingAssignment.name}"`,
      );
    }

    // Assigner l'admin au territoire
    const updatedTerritory = await this.prisma.territory.update({
      where: { id: territoryId },
      data: { adminId },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedTerritory;
  }

  /**
   * Réassigner un admin à un territoire (changement d'admin)
   * Avec transaction pour mettre à jour aussi les vendeurs
   */
  async reassignTerritoryAdmin(territoryId: string, newAdminId: string) {
    // Vérifier que le territoire existe
    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        users: {
          where: { role: 'REP' },
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!territory) {
      throw new NotFoundException(
        `Territoire avec l'ID ${territoryId} introuvable`,
      );
    }

    // Vérifier que le nouvel admin existe et a le bon rôle
    const newAdmin = await this.prisma.user.findUnique({
      where: { id: newAdminId },
    });

    if (!newAdmin) {
      throw new NotFoundException(
        `Administrateur avec l'ID ${newAdminId} introuvable`,
      );
    }

    if (newAdmin.role !== 'ADMIN') {
      throw new BadRequestException(
        'Seul un utilisateur avec le rôle ADMIN peut être assigné à un territoire',
      );
    }

    // Vérifier que le nouvel admin n'a pas déjà un territoire
    const existingAssignment = await this.prisma.territory.findFirst({
      where: {
        adminId: newAdminId,
        id: { not: territoryId }, // Exclure le territoire actuel
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `Cet administrateur gère déjà le territoire "${existingAssignment.name}"`,
      );
    }

    // Transaction atomique : tout réussit ou tout échoue
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Mettre à jour l'admin du territoire
      const updatedTerritory = await prisma.territory.update({
        where: { id: territoryId },
        data: { adminId: newAdminId },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // 2. Mettre à jour le managerId de tous les vendeurs (REP) de ce territoire
      await prisma.user.updateMany({
        where: {
          territoryId,
          role: 'REP',
        },
        data: {
          managerId: newAdminId,
        },
      });

      // 3. Logger l'action (optionnel mais recommandé)
      await prisma.auditLog.create({
        data: {
          action: 'TERRITORY_ADMIN_REASSIGNED',
          entity: 'Territory',
          entityId: territoryId,
          diff: {
            oldAdminId: territory.adminId,
            newAdminId: newAdminId,
            affectedVendors: territory.users.length,
          },
        },
      });

      return updatedTerritory;
    });

    return result;
  }

  /**
   * Retirer l'admin d'un territoire
   */
  async removeTerritoryAdmin(territoryId: string) {
    // Vérifier que le territoire existe
    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
    });

    if (!territory) {
      throw new NotFoundException(
        `Territoire avec l'ID ${territoryId} introuvable`,
      );
    }

    if (!territory.adminId) {
      throw new BadRequestException(
        "Ce territoire n'a pas d'administrateur assigné",
      );
    }

    // Retirer l'admin
    const updatedTerritory = await this.prisma.territory.update({
      where: { id: territoryId },
      data: { adminId: null },
    });

    return updatedTerritory;
  }

  /**
   * Obtenir la liste des admins disponibles (sans territoire ou pour réassignation)
   */
  async getAvailableAdmins(excludeTerritoryId?: string) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
        status: 'ACTIVE',
        OR: [
          // ADMINs qui ne gèrent aucun territoire
          { adminTerritories: { none: {} } },
          // OU l'admin qui gère le territoire actuel (pour réassignation)
          ...(excludeTerritoryId
            ? [{ adminTerritories: { some: { id: excludeTerritoryId } } }]
            : []),
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        adminTerritories: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return admins;
  }

  /**
   * Réassigner un vendeur à un secteur (changement)
   */
  async reassignSectorVendor(sectorId: string, newVendorId: string) {
    // Vérifier que le secteur existe
    const sector = await this.prisma.territory.findUnique({
      where: { id: sectorId, level: TerritoryLevel.SECTEUR },
      include: {
        assignedUsers: true,
        parent: true,
      },
    });

    if (!sector) {
      throw new NotFoundException(`Secteur avec l'ID ${sectorId} introuvable`);
    }

    // Vérifier que le nouveau vendeur existe et est actif
    const newVendor = await this.prisma.user.findUnique({
      where: { id: newVendorId, role: RoleEnum.REP, status: 'ACTIVE' },
    });

    if (!newVendor) {
      throw new NotFoundException(
        `Vendeur avec l'ID ${newVendorId} introuvable ou inactif`,
      );
    }

    // Vérifier que le vendeur n'a pas déjà un secteur assigné
    const existingAssignment = await this.prisma.user.findFirst({
      where: {
        id: newVendorId,
        assignedSectorId: { not: null },
      },
    });

    if (
      existingAssignment &&
      existingAssignment.assignedSectorId !== sectorId
    ) {
      throw new BadRequestException(
        "Ce vendeur a déjà un secteur assigné. Désassignez-le d'abord.",
      );
    }

    // Transaction pour réassigner
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Désassigner l'ancien vendeur s'il y en a un
      if (sector.assignedUsers.length > 0) {
        await prisma.user.updateMany({
          where: { assignedSectorId: sectorId },
          data: { assignedSectorId: null },
        });
      }

      // 2. Assigner le nouveau vendeur
      await prisma.user.update({
        where: { id: newVendorId },
        data: { assignedSectorId: sectorId },
      });

      // 3. Retourner le secteur mis à jour
      return prisma.territory.findUnique({
        where: { id: sectorId },
        include: {
          parent: true,
          assignedUsers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          outletsSector: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });
    });

    return result;
  }

  /**
   * Désassigner un vendeur d'un secteur
   */
  async unassignSectorVendor(sectorId: string) {
    // Vérifier que le secteur existe
    const sector = await this.prisma.territory.findUnique({
      where: { id: sectorId, level: TerritoryLevel.SECTEUR },
      include: {
        assignedUsers: true,
        parent: true,
      },
    });

    if (!sector) {
      throw new NotFoundException(`Secteur avec l'ID ${sectorId} introuvable`);
    }

    if (sector.assignedUsers.length === 0) {
      throw new BadRequestException("Ce secteur n'a pas de vendeur assigné");
    }

    // Désassigner tous les vendeurs du secteur
    await this.prisma.user.updateMany({
      where: { assignedSectorId: sectorId },
      data: { assignedSectorId: null },
    });

    // Retourner le secteur mis à jour
    const updatedSector = await this.prisma.territory.findUnique({
      where: { id: sectorId },
      include: {
        parent: true,
        assignedUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        outletsSector: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return updatedSector;
  }

  /**
   * Récupérer tous les territoires d'un manager SUP
   */
  async getManagerTerritories(managerId: string) {
    const territories = await this.prisma.territory.findMany({
      where: {
        managerId: managerId,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        regions: true,
        communes: true,
        villes: true,
        quartiers: true,
        codesPostaux: true,
        lat: true,
        lng: true,
        population: true,
        superficie: true,
        densitePopulation: true,
        potentielCommercial: true,
        categorieMarche: true,
        typeZone: true,
        nombrePDVEstime: true,
        tauxPenetration: true,
        parentId: true,
        adminId: true,
        managerId: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            outletsTerritory: true,
            outletsSector: true,
            assignedUsers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return territories;
  }
}
