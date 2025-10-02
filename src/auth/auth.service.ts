import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, RegisterDto } from './dto';
import { AuthResponse, JwtPayload, UserResponse } from './interfaces';
import { AUTH_ERRORS, AUTH_MESSAGES } from './constants';
import * as bcrypt from 'bcrypt';

/**
 * Service d'authentification
 * Gère l'inscription, la connexion et la génération de tokens
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Inscrire un nouvel utilisateur
   * @param registerDto - Données d'inscription de l'utilisateur
   * @returns Réponse d'authentification avec les données utilisateur et le token
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(registerDto);

    const token = this.generateToken(user.id, user.email);
    const userResponse = this.mapToUserResponse(user);

    return {
      success: true,
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      user: userResponse,
      access_token: token,
    };
  }

  /**
   * Authentifier un utilisateur
   * @param loginDto - Identifiants de connexion de l'utilisateur
   * @returns Réponse d'authentification avec les données utilisateur et le token
   * @throws UnauthorizedException si les identifiants sont invalides
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const token = this.generateToken(user.id, user.email);
    const userResponse = this.mapToUserResponse(user);

    return {
      success: true,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      user: userResponse,
      access_token: token,
    };
  }

  /**
   * Valider un utilisateur par ID (utilisé par la stratégie JWT)
   * @param userId - ID de l'utilisateur à valider
   * @returns Utilisateur si trouvé, null sinon
   */
  async validateUser(userId: string) {
    return await this.usersService.findById(userId);
  }

  /**
   * Générer un token JWT pour l'utilisateur
   * @param userId - ID de l'utilisateur
   * @param email - Email de l'utilisateur
   * @returns Token JWT signé
   */
  private generateToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Valider le mot de passe contre le hash
   * @param password - Mot de passe en clair
   * @param hashedPassword - Mot de passe hashé de la base de données
   * @returns True si le mot de passe est valide
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Mapper l'entité utilisateur au format de réponse
   * @param user - Entité utilisateur
   * @returns Objet de réponse utilisateur
   */
  private mapToUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
