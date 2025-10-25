import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPerformanceDto } from './dto/user-performance.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RoleEnum, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    creatorId?: string,
  ): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Déterminer le territoire et secteur du nouvel utilisateur
    let territoryId = createUserDto.territoryId;
    let managerId = createUserDto.managerId;

    // Si un creatorId est fourni (création par un admin)
    if (creatorId) {
      const creator = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { territoryId: true, role: true },
      });

      if (creator) {
        // Si le créateur est ADMIN et que le nouvel utilisateur est REP
        if (creator.role === 'ADMIN' && createUserDto.role === 'REP') {
          // Le vendeur hérite automatiquement du territoire (ZONE) de l'admin
          if (!territoryId) {
            territoryId = creator.territoryId;
          }

          // Assigner automatiquement l'admin comme manager
          managerId = creatorId;
        }
      }
    }

    // Si toujours pas de territoire, utiliser le territoire par défaut
    if (!territoryId) {
      const defaultTerritory = await this.prisma.territory.findFirst({
        where: { code: 'DEFAULT' },
      });

      if (!defaultTerritory) {
        throw new Error('Default territory not found. Please run seed script.');
      }

      territoryId = defaultTerritory.id;
    }

    // Créer le nouvel utilisateur avec Prisma
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: (createUserDto.role as RoleEnum) || 'REP', // Rôle par défaut: REP
        status: 'ACTIVE',
        territoryId: territoryId,
        ...(managerId && { managerId }), // N'inclure managerId que s'il est défini
        // Note: assignedSectorId peut être ajouté via update après création du vendeur
      },
    });

    // Retourner l'utilisateur au format attendu
    return this.mapPrismaUserToEntity(newUser);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return undefined;
    }

    return this.mapPrismaUserToEntity(user);
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.mapPrismaUserToEntity(user);
  }

  async findByIdWithRelations(id: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    phone: string | null;
    photoUrl: string | null;
    employeeId: string | null;
    hireDate: string | null;
    territory: string | null;
    territoryName: string | null;
    manager: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        territory: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Mapper les données avec les relations
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.status === 'ACTIVE',
      phone: user.phone || null,
      photoUrl: user.photoUrl || null,
      employeeId: user.employeeId || null,
      hireDate: user.hireDate?.toISOString().split('T')[0] || null,
      territory: user.territory?.name || null,
      territoryName: user.territory?.name || null,
      manager: user.manager
        ? `${user.manager.firstName} ${user.manager.lastName}`
        : null,
    };
  }

  async findAll(currentUserId?: string): Promise<User[]> {
    // Si pas d'utilisateur connecté, retourner tous les utilisateurs (pour compatibilité)
    if (!currentUserId) {
      const users = await this.prisma.user.findMany();
      return users.map((user) => this.mapPrismaUserToEntity(user));
    }

    // Récupérer l'utilisateur connecté
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (!currentUser) {
      const users = await this.prisma.user.findMany();
      return users.map((user) => this.mapPrismaUserToEntity(user));
    }

    // Si l'utilisateur est ADMIN, il ne voit que les vendeurs qu'il a créés (managerId = son ID)
    if (currentUser.role === 'ADMIN') {
      const users = await this.prisma.user.findMany({
        where: {
          managerId: currentUserId,
          role: 'REP', // Les admins ne voient que les vendeurs
        },
        include: {
          territory: {
            select: {
              name: true,
            },
          },
        },
      });
      return users.map((user) => this.mapPrismaUserToEntity(user));
    }

    // Si l'utilisateur est SUP (Manager), il voit tous les utilisateurs
    if (currentUser.role === 'SUP') {
      const users = await this.prisma.user.findMany();
      return users.map((user) => this.mapPrismaUserToEntity(user));
    }

    // Pour les autres rôles (REP), ne retourner que l'utilisateur lui-même
    const users = await this.prisma.user.findMany({
      where: { id: currentUserId },
    });
    return users.map((user) => this.mapPrismaUserToEntity(user));
  }

  async getManagers(): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      role: string;
    }>
  > {
    const managers = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['SUP', 'ADMIN'],
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return managers;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Préparer les données à mettre à jour
    const { password, role, ...otherData } = updateUserDto;
    const updateData: Prisma.UserUpdateInput = {
      ...otherData,
      ...(role && { role: role as RoleEnum }),
    };

    // Si le mot de passe est fourni, le hasher
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaUserToEntity(updatedUser);
  }

  async remove(id: string): Promise<void> {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'utilisateur
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string): Promise<User> {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Inverser le statut
    const newStatus = existingUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // Mettre à jour le statut
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    return this.mapPrismaUserToEntity(updatedUser);
  }

  /**
   * Upload de photo de profil
   */
  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'ancienne photo si elle existe
    if (user.photoUrl) {
      const publicId = this.cloudinaryService.extractPublicId(user.photoUrl);
      if (publicId) {
        try {
          await this.cloudinaryService.deleteImage(publicId);
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'ancienne photo:",
            error,
          );
        }
      }
    }

    // Upload la nouvelle photo
    const photoUrl = await this.cloudinaryService.uploadImage(file);

    // Mettre à jour l'utilisateur
    await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl },
    });

    return photoUrl;
  }

  /**
   * Récupérer les performances d'un utilisateur
   */
  async getUserPerformance(userId: string): Promise<UserPerformanceDto> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Calculer le début et la fin du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Compter le nombre total de PDV dans le territoire de l'utilisateur
    const totalOutlets = await this.prisma.outlet.count({
      where: {
        territoryId: user.territoryId,
        status: 'APPROVED',
      },
    });

    // Compter les visites ce mois
    const visitsThisMonth = await this.prisma.visit.count({
      where: {
        userId: userId,
        checkinAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Compter les PDV uniques visités ce mois
    const visitedOutlets = await this.prisma.visit.findMany({
      where: {
        userId: userId,
        checkinAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        outletId: true,
      },
      distinct: ['outletId'],
    });

    // Compter les commandes ce mois
    const ordersThisMonth = await this.prisma.order.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ['CONFIRMED', 'DELIVERED'],
        },
      },
    });

    // Calculer le CA total ce mois
    const ordersSum = await this.prisma.order.aggregate({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ['CONFIRMED', 'DELIVERED'],
        },
      },
      _sum: {
        totalTtc: true,
      },
    });

    // Calculer les scores Perfect Store (moyenne des scores de visite)
    const visitScores = await this.prisma.visit.aggregate({
      where: {
        userId: userId,
        checkinAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        score: {
          not: null,
        },
      },
      _avg: {
        score: true,
      },
    });

    const salesThisMonth = Number(ordersSum._sum.totalTtc || 0);
    const averageOrderValue =
      ordersThisMonth > 0 ? salesThisMonth / ordersThisMonth : 0;
    const coverage =
      totalOutlets > 0 ? (visitedOutlets.length / totalOutlets) * 100 : 0;
    const strikeRate =
      visitsThisMonth > 0 ? (ordersThisMonth / visitsThisMonth) * 100 : 0;
    const perfectStoreScore = visitScores._avg.score || 0;

    return {
      coverage: Math.round(coverage * 10) / 10,
      strikeRate: Math.round(strikeRate * 10) / 10,
      visitsThisMonth,
      salesThisMonth: Math.round(salesThisMonth),
      perfectStoreScore: Math.round(perfectStoreScore * 10) / 10,
      totalOutlets,
      visitedOutlets: visitedOutlets.length,
      ordersThisMonth,
      averageOrderValue: Math.round(averageOrderValue),
    };
  }

  /**
   * Mapper un utilisateur Prisma vers l'entité User
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapPrismaUserToEntity(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: prismaUser.role,
      status: prismaUser.status,
      territoryId: prismaUser.territoryId,
      phone: prismaUser.phone ?? undefined,
      employeeId: prismaUser.employeeId ?? undefined,
      hireDate: prismaUser.hireDate ?? undefined,
      managerId: prismaUser.managerId ?? undefined,
      photoUrl: prismaUser.photoUrl ?? undefined,
      lockedUntil: prismaUser.lockedUntil ?? undefined,
      resetToken: prismaUser.resetToken ?? undefined,
      resetTokenExpiry: prismaUser.resetTokenExpiry ?? undefined,
      twoFactorSecret: prismaUser.twoFactorSecret ?? undefined,
      twoFactorEnabled: prismaUser.twoFactorEnabled,
      emailVerified: prismaUser.emailVerified,
      emailVerificationToken: prismaUser.emailVerificationToken ?? undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
