import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // Stockage temporaire en mémoire (à remplacer par une vraie DB plus tard)
  private users: User[] = [];

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = this.users.find(
      (user) => user.email === createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Créer le nouvel utilisateur
    const newUser: User = {
      id: Date.now().toString(),
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...result } = newUser;
    return result as User;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    // Retourner tous les utilisateurs sans les mots de passe
    return this.users.map(({ password, ...user }) => user as User);
  }
}
