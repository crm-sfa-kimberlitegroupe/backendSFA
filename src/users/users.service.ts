import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Get default territory
    const defaultTerritory = await this.prisma.territory.findFirst({
      where: { code: 'DEFAULT' },
    });

    if (!defaultTerritory) {
      throw new Error('Default territory not found. Please run seed script.');
    }

    // Créer le nouvel utilisateur avec Prisma
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: 'REP', // Rôle par défaut, à adapter selon vos besoins
        status: 'ACTIVE',
        territoryId: defaultTerritory.id,
      },
    });

    // Retourner l'utilisateur au format attendu
    return {
      id: newUser.id,
      email: newUser.email,
      password: newUser.passwordHash,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return undefined;
    }

    return {
      id: user.id,
      email: user.email,
      password: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      password: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      password: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}
