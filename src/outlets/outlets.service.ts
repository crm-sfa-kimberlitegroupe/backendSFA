import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { OutletStatusEnum, Prisma } from '@prisma/client';

@Injectable()
export class OutletsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau point de vente
   */
  async create(createOutletDto: CreateOutletDto, userId?: string) {
    // Générer un code unique si non fourni
    let code = createOutletDto.code;
    if (!code || code === 'AUTO-GEN') {
      code = await this.generateUniqueCode();
    }

    // Vérifier que le code n'existe pas déjà
    const existingOutlet = await this.prisma.outlet.findUnique({
      where: { code },
    });

    if (existingOutlet) {
      throw new BadRequestException(`Un PDV avec le code ${code} existe déjà`);
    }

    // Déterminer le territoire et le secteur du PDV
    let territoryId = createOutletDto.territoryId;
    let sectorId = createOutletDto.sectorId;

    // Si un userId est fourni, récupérer le territoire ET le secteur assigné de l'utilisateur
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          territoryId: true,
          assignedSectorId: true, // ⭐ Récupérer le secteur assigné au vendeur
        },
      });
      if (user) {
        // Le PDV hérite automatiquement du territoire ET du secteur du vendeur
        territoryId = user.territoryId;

        // ⭐ HÉRITAGE AUTOMATIQUE DU SECTEUR
        // Si le vendeur a un secteur assigné, le PDV hérite de ce secteur
        if (user.assignedSectorId && !sectorId) {
          sectorId = user.assignedSectorId;
        }
      }
    }

    // Vérifier que territoryId est défini
    if (!territoryId) {
      throw new BadRequestException('Le territoire est requis');
    }

    // 🗺️ Récupérer les informations géographiques du territoire
    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
      select: {
        region: true,
        commune: true,
        ville: true,
        quartier: true,
        codePostal: true,
      },
    });

    if (!territory) {
      throw new NotFoundException(`Territoire ${territoryId} introuvable`);
    }

    // Créer le PDV avec les informations géographiques héritées du territoire
    const outlet = await this.prisma.outlet.create({
      data: {
        code,
        name: createOutletDto.name,
        channel: createOutletDto.channel,
        segment: createOutletDto.segment || undefined,
        address: createOutletDto.address || undefined,
        lat: createOutletDto.lat || undefined,
        lng: createOutletDto.lng || undefined,
        openHours: createOutletDto.openHours || {},
        status: createOutletDto.status || OutletStatusEnum.PENDING,
        territoryId: territoryId,
        sectorId: sectorId || undefined,  // ⭐ Assigner le secteur hérité
        // 🗺️ Copier les informations géographiques du territoire
        region: territory.region || undefined,
        commune: territory.commune || undefined,
        ville: territory.ville || undefined,
        quartier: territory.quartier || undefined,
        codePostal: territory.codePostal || undefined,

        proposedBy: userId || createOutletDto.proposedBy || undefined,
        validationComment: createOutletDto.validationComment || undefined,
        osmPlaceId: createOutletDto.osmPlaceId || undefined,
        osmMetadata: (createOutletDto.osmMetadata ||
          {}) as Prisma.InputJsonValue,
      },
      include: {
        territory: true,
        proposer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return outlet;
  }

  async findAll(filters?: {
    status?: OutletStatusEnum;
    territoryId?: string;
    sectorId?: string;
    channel?: string;
    proposedBy?: string;
    region?: string;
    commune?: string;
    ville?: string;
    quartier?: string;
  }) {
    console.log('🔍 [findAll] Filtres reçus:', filters);

    const where: Prisma.OutletWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
      console.log('🔍 Filtre status appliqué:', filters.status);
    }
    if (filters?.territoryId) {
      where.territoryId = filters.territoryId;
      console.log('🔍 Filtre territoryId appliqué:', filters.territoryId);
    }
    if (filters?.sectorId) {
      where.sectorId = filters.sectorId;
      console.log('🔍 Filtre sectorId appliqué:', filters.sectorId);
    }
    if (filters?.channel) {
      where.channel = filters.channel;
      console.log('🔍 Filtre channel appliqué:', filters.channel);
    }
    if (filters?.proposedBy) {
      where.proposedBy = filters.proposedBy;
      console.log('🔍 Filtre proposedBy appliqué:', filters.proposedBy);
    }
    // 🗺️ Filtres géographiques
    if (filters?.region) {
      where.region = filters.region;
      console.log('🔍 Filtre region appliqué:', filters.region);
    }
    if (filters?.commune) {
      where.commune = filters.commune;
      console.log('🔍 Filtre commune appliqué:', filters.commune);
    }
    if (filters?.ville) {
      where.ville = filters.ville;
      console.log('🔍 Filtre ville appliqué:', filters.ville);
    }
    if (filters?.quartier) {
      where.quartier = filters.quartier;
      console.log('🔍 Filtre quartier appliqué:', filters.quartier);
    }

    console.log('🔍 Clause WHERE finale:', JSON.stringify(where));

    const outlets = await this.prisma.outlet.findMany({
      where,
      include: {
        territory: true,
        proposer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔍 Nombre de PDV trouvés dans la DB:', outlets?.length || 0);
    if (outlets?.length > 0) {
      console.log('🔍 Premier PDV:', {
        id: outlets[0].id,
        name: outlets[0].name,
        status: outlets[0].status,
        territoryId: outlets[0].territoryId,
      });
    }

    return outlets;
  }

  /**
   * Récupérer un point de vente par ID
   */
  async findOne(id: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id },
      include: {
        territory: true,
        proposer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!outlet) {
      throw new NotFoundException(`Point de vente avec l'ID ${id} non trouvé`);
    }

    return outlet;
  }

  /**
   * Mettre à jour un point de vente
   */
  async update(id: string, updateOutletDto: UpdateOutletDto) {
    // Vérifier que le PDV existe
    await this.findOne(id);

    // Extraire territoryId du DTO car il ne peut pas être modifié
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { territoryId, ...updateData } = updateOutletDto;
    const outlet = await this.prisma.outlet.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      } as Prisma.OutletUpdateInput,
      include: {
        territory: true,
        proposer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return outlet;
  }

  /**
   * Approuver un point de vente
   * Seuls les admins du même territoire peuvent valider
   */
  async approve(id: string, validatorId?: string) {
    // Récupérer le PDV
    const outlet = await this.findOne(id);
    // Si un validatorId est fourni, vérifier qu'il a le même territoire
    if (validatorId) {
      const validator = await this.prisma.user.findUnique({
        where: { id: validatorId },
        select: { territoryId: true, role: true },
      });

      if (!validator) {
        throw new BadRequestException('Validateur non trouvé');
      }

      // Vérifier que le validateur est ADMIN
      if (validator.role !== 'ADMIN') {
        throw new BadRequestException(
          'Seuls les admins peuvent valider les PDV',
        );
      }

      // Vérifier que le validateur a le même territoire que le PDV
      if (validator.territoryId !== outlet.territoryId) {
        throw new BadRequestException(
          'Vous ne pouvez valider que les PDV de votre territoire',
        );
      }
    }
    const updateData: UpdateOutletDto = {
      status: OutletStatusEnum.APPROVED,
      validatedAt: new Date(),
    };
    if (validatorId) {
      updateData.validatedBy = validatorId;
    }
    return this.update(id, updateData);
  }

  /**
   * Rejeter un point de vente
   * Seuls les admins du même territoire peuvent rejeter
   */
  async reject(id: string, reason?: string, validatorId?: string) {
    // Récupérer le PDV
    const outlet = await this.findOne(id);

    // Si un validatorId est fourni, vérifier qu'il a le même territoire
    if (validatorId) {
      const validator = await this.prisma.user.findUnique({
        where: { id: validatorId },
        select: { territoryId: true, role: true },
      });

      if (!validator) {
        throw new BadRequestException('Validateur non trouvé');
      }

      // Vérifier que le validateur est ADMIN
      if (validator.role !== 'ADMIN') {
        throw new BadRequestException(
          'Seuls les admins peuvent rejeter les PDV',
        );
      }

      // Vérifier que le validateur a le même territoire que le PDV
      if (validator.territoryId !== outlet.territoryId) {
        throw new BadRequestException(
          'Vous ne pouvez rejeter que les PDV de votre territoire',
        );
      }
    }

    const updateData: UpdateOutletDto = {
      status: OutletStatusEnum.REJECTED,
      validationComment: reason,
      validatedAt: new Date(),
    };
    if (validatorId) {
      updateData.validatedBy = validatorId;
    }
    return this.update(id, updateData);
  }

  /**
   * Supprimer un point de vente
   */
  async remove(id: string) {
    // Vérifier que le PDV existe
    await this.findOne(id);

    await this.prisma.outlet.delete({
      where: { id },
    });

    return { message: 'Point de vente supprimé avec succès' };
  }

  /**
   * Générer un code unique pour un PDV
   */
  private async generateUniqueCode(): Promise<string> {
    const prefix = 'PDV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const code = `${prefix}-${timestamp}-${random}`;

    // Vérifier que le code n'existe pas déjà
    const existing = await this.prisma.outlet.findUnique({
      where: { code },
    });

    if (existing) {
      // Régénérer si le code existe déjà (très rare)
      return this.generateUniqueCode();
    }

    return code;
  }

  /**
   * Obtenir les statistiques des PDV
   */
  async getStats(filters?: { territoryId?: string; proposedBy?: string }) {
    const where: Prisma.OutletWhereInput = {};

    if (filters?.territoryId) {
      where.territoryId = filters.territoryId;
    }
    if (filters?.proposedBy) {
      where.proposedBy = filters.proposedBy;
    }

    const [total, pending, approved, rejected, inactive] = await Promise.all([
      this.prisma.outlet.count({ where }),
      this.prisma.outlet.count({
        where: { ...where, status: OutletStatusEnum.PENDING },
      }),
      this.prisma.outlet.count({
        where: { ...where, status: OutletStatusEnum.APPROVED },
      }),
      this.prisma.outlet.count({
        where: { ...where, status: OutletStatusEnum.REJECTED },
      }),
      this.prisma.outlet.count({
        where: { ...where, status: OutletStatusEnum.INACTIVE },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      inactive,
    };
  }
}
