import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/entities/user.entity';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Verify2FADto,
  RefreshTokenDto,
} from './dto';
import {
  AuthResponse,
  JwtPayload,
  UserResponse,
  PasswordResetResponse,
  TwoFactorSetupResponse,
  TwoFactorResponse,
  RefreshTokenResponse,
  TwoFactorRequiredResponse,
} from './interfaces';
import { AUTH_ERRORS, AUTH_MESSAGES, AUTH_CONSTANTS } from './constants';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

/**
 * Service d'authentification
 * Gère l'inscription, la connexion et toutes les fonctionnalités d'authentification avancées
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscrire un nouvel utilisateur
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(registerDto);

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.territoryId || '',
    );

    // Récupérer les informations du territoire et du manager
    const userWithRelations = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        territory: true,
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const userResponse = this.mapToUserResponse(user, userWithRelations);

    return {
      success: true,
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Authentifier un utilisateur avec protection contre les tentatives non autorisées
   */
  async login(
    loginDto: LoginDto,
    ip: string,
    userAgent?: string,
  ): Promise<AuthResponse | TwoFactorRequiredResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Vérifier si le compte est verrouillé
    if (user?.lockedUntil && new Date() < user.lockedUntil) {
      await this.logLoginAttempt(
        user.id,
        loginDto.email,
        ip,
        userAgent,
        false,
        'Account locked',
      );
      throw new UnauthorizedException(AUTH_ERRORS.ACCOUNT_LOCKED);
    }

    if (!user) {
      await this.logLoginAttempt(
        null,
        loginDto.email,
        ip,
        userAgent,
        false,
        'User not found',
      );
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, loginDto.email, ip, userAgent);
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    // Vérifier si 2FA est activé
    if (user.twoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return {
          success: false,
          message: AUTH_ERRORS.TWO_FACTOR_REQUIRED,
          requiresTwoFactor: true,
        };
      }

      const is2FAValid = this.verify2FACode(
        user.twoFactorSecret!,
        loginDto.twoFactorCode,
      );

      if (!is2FAValid) {
        await this.logLoginAttempt(
          user.id,
          loginDto.email,
          ip,
          userAgent,
          false,
          'Invalid 2FA code',
        );
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_2FA_CODE);
      }
    }

    // Connexion réussie
    await this.logLoginAttempt(user.id, loginDto.email, ip, userAgent, true);
    await this.resetFailedLoginAttempts(user.id);

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.territoryId || '',
      ip,
      userAgent,
    );

    // Récupérer les informations du territoire et du manager
    const userWithRelations = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        territory: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
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

    const userResponse = this.mapToUserResponse(user, userWithRelations);

    return {
      success: true,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * SCRUM-38: Demande de réinitialisation de mot de passe
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponse> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
      };
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiryDate = new Date();
    expiryDate.setHours(
      expiryDate.getHours() + AUTH_CONSTANTS.RESET_TOKEN_EXPIRATION_HOURS,
    );

    // Sauvegarder le token dans la base de données
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiryDate,
      },
    });

    // TODO: Envoyer l'email avec le resetToken (non hashé)
    this.logger.log(
      `Password reset token generated for user ${user.email}: ${resetToken}`,
    );

    return {
      success: true,
      message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
    };
  }

  /**
   * SCRUM-38: Réinitialiser le mot de passe avec le token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponse> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_RESET_TOKEN);
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Mettre à jour le mot de passe et supprimer le token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      success: true,
      message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
    };
  }

  /**
   * SCRUM-40: Générer le QR code pour l'authentification 2FA
   */
  async generate2FASecret(userId: string): Promise<TwoFactorSetupResponse> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(AUTH_ERRORS.TWO_FACTOR_ALREADY_ENABLED);
    }

    // Générer un secret pour TOTP
    const secret = speakeasy.generateSecret({
      name: `${AUTH_CONSTANTS.TWO_FACTOR_APP_NAME} (${user.email})`,
      length: 32,
    });

    // Sauvegarder le secret temporairement (non activé)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    // Générer le QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    return {
      success: true,
      message: 'QR code généré avec succès',
      qrCode: qrCodeUrl,
      secret: secret.base32!,
    };
  }

  /**
   * SCRUM-40: Activer l'authentification 2FA
   */
  async enable2FA(
    userId: string,
    verify2FADto: Verify2FADto,
  ): Promise<TwoFactorResponse> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException("Veuillez d'abord générer un secret 2FA");
    }

    // Vérifier le code TOTP
    const isValid = this.verify2FACode(user.twoFactorSecret, verify2FADto.code);

    if (!isValid) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_2FA_CODE);
    }

    // Activer 2FA
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
      },
    });

    return {
      success: true,
      message: AUTH_MESSAGES.TWO_FACTOR_ENABLED,
      twoFactorEnabled: true,
    };
  }

  /**
   * SCRUM-40: Vérifier un code 2FA
   */
  async verify2FA(
    userId: string,
    verify2FADto: Verify2FADto,
  ): Promise<TwoFactorResponse> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException(AUTH_ERRORS.TWO_FACTOR_NOT_ENABLED);
    }

    const isValid = this.verify2FACode(user.twoFactorSecret, verify2FADto.code);

    if (!isValid) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_2FA_CODE);
    }

    return {
      success: true,
      message: AUTH_MESSAGES.TWO_FACTOR_VERIFIED,
      twoFactorEnabled: true,
    };
  }

  /**
   * SCRUM-40: Désactiver l'authentification 2FA
   */
  async disable2FA(userId: string): Promise<TwoFactorResponse> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException(AUTH_ERRORS.TWO_FACTOR_NOT_ENABLED);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return {
      success: true,
      message: AUTH_MESSAGES.TWO_FACTOR_DISABLED,
      twoFactorEnabled: false,
    };
  }

  /**
   * Bonus: Rafraîchir le token d'accès
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    ip: string,
    userAgent?: string,
  ): Promise<RefreshTokenResponse> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    // Révoquer l'ancien refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Générer de nouveaux tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      storedToken.userId,
      storedToken.user.email,
      storedToken.user.role,
      storedToken.user.territoryId,
      ip,
      userAgent,
    );

    return {
      success: true,
      message: AUTH_MESSAGES.TOKEN_REFRESHED,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Bonus: Déconnexion (invalider le refresh token)
   */
  async logout(refreshToken: string): Promise<PasswordResetResponse> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    };
  }

  /**
   * Bonus: Déconnexion de tous les appareils
   */
  async logoutAll(userId: string): Promise<PasswordResetResponse> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'Déconnecté de tous les appareils',
    };
  }

  /**
   * Valider un utilisateur par ID (utilisé par la stratégie JWT)
   */
  async validateUser(userId: string) {
    return await this.usersService.findById(userId);
  }

  // ========================================
  // MÉTHODES PRIVÉES
  // ========================================

  /**
   * Générer les tokens JWT (access + refresh)
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    territoryId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      territoryId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION,
    });

    // Générer un refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    // Stocker le refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
        ip,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Valider le mot de passe contre le hash
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Vérifier un code TOTP 2FA
   */
  private verify2FACode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2, // Accepter les codes dans une fenêtre de ±2 intervalles (60s)
    });
  }

  /**
   * Logger une tentative de connexion
   */
  private async logLoginAttempt(
    userId: string | null,
    email: string,
    ip: string,
    userAgent: string | undefined,
    success: boolean,
    reason?: string,
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        userId,
        email,
        ip,
        userAgent,
        success,
        reason,
      },
    });

    if (!success) {
      this.logger.warn(
        `Failed login attempt for ${email} from IP ${ip}. Reason: ${reason}`,
      );
    }
  }

  /**
   * Gérer les échecs de connexion et verrouiller le compte si nécessaire
   */
  private async handleFailedLogin(
    userId: string,
    email: string,
    ip: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logLoginAttempt(
      userId,
      email,
      ip,
      userAgent,
      false,
      'Invalid password',
    );

    // Compter les tentatives échouées dans les dernières 15 minutes
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - AUTH_CONSTANTS.LOGIN_ATTEMPTS_WINDOW_MINUTES,
    );

    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    // Verrouiller le compte après 5 tentatives échouées
    if (failedAttempts >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(
        lockUntil.getMinutes() + AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION_MINUTES,
      );

      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: lockUntil },
      });

      this.logger.warn(
        `Account ${email} locked until ${lockUntil.toISOString()} due to ${failedAttempts} failed login attempts`,
      );
    }
  }

  /**
   * Réinitialiser les tentatives de connexion échouées après une connexion réussie
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: null },
    });
  }

  /**
   * Récupérer le profil complet de l'utilisateur
   */
  async getProfile(
    userId: string,
  ): Promise<{ success: boolean; user: UserResponse }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Récupérer les informations du territoire et du manager
    const userWithRelations = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        territory: true,
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      user: this.mapToUserResponse(user, userWithRelations),
    };
  }

  /**
   * Mapper l'entité utilisateur au format de réponse
   */
  private mapToUserResponse(
    user: User,
    relations?: {
      territory?: { name: string } | null;
      manager?: { firstName: string; lastName: string } | null;
    } | null,
  ): UserResponse {
    const response: UserResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.status === 'ACTIVE',
      photoUrl: user.photoUrl,
      phone: user.phone,
      employeeId: user.employeeId,
      hireDate: user.hireDate?.toISOString().split('T')[0],
    };

    // Ajouter le territoryId (toujours présent)
    response.territoryId = user.territoryId;
    
    // Ajouter le nom du territoire si disponible, sinon l'ID
    if (relations?.territory) {
      response.territory = relations.territory.name;
      response.territoryName = relations.territory.name;
    } else {
      response.territory = user.territoryId;
    }

    // Ajouter le nom du manager si disponible
    if (relations?.manager) {
      response.manager = `${relations.manager.firstName} ${relations.manager.lastName}`;
    }

    return response;
  }
}
