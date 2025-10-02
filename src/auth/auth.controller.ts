import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards';
import { GetUser } from './decorators';
import type { RequestUser, AuthResponse, ProfileResponse } from './interfaces';

/**
 * Contrôleur d'authentification
 * Gère les endpoints liés à l'authentification
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inscrire un nouvel utilisateur
   * @param registerDto - Données d'inscription de l'utilisateur
   * @returns Réponse d'authentification avec le token
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  /**
   * Connecter un utilisateur
   * @param loginDto - Identifiants de connexion de l'utilisateur
   * @returns Réponse d'authentification avec le token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * Récupérer le profil de l'utilisateur authentifié
   * @param user - Utilisateur authentifié depuis le JWT
   * @returns Données du profil utilisateur
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: RequestUser): ProfileResponse {
    // Dans une vraie application, vous voudriez récupérer les détails complets de l'utilisateur depuis la base de données
    return {
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        firstName: '', // Ces données viendraient de la base de données
        lastName: '',
      },
    };
  }

  /**
   * Endpoint de vérification de santé
   */
  @Get('health')
  healthCheck() {
    return {
      success: true,
      message: "Le module d'authentification fonctionne",
      timestamp: new Date().toISOString(),
    };
  }
}
