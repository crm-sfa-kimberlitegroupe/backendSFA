import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Verify2FADto,
  RefreshTokenDto,
} from './dto';
import { JwtAuthGuard } from './guards';
import { GetUser } from './decorators';
import type {
  RequestUser,
  AuthResponse,
  ProfileResponse,
  PasswordResetResponse,
  TwoFactorSetupResponse,
  TwoFactorResponse,
  RefreshTokenResponse,
  TwoFactorRequiredResponse,
} from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 tentatives par 15 minutes
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponse | TwoFactorRequiredResponse> {
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: RequestUser): ProfileResponse {
    return {
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        firstName: '',
        lastName: '',
        role: 'REP',
        isActive: true,
      },
    };
  }

  // ========================================
  // SCRUM-38: Récupération de mot de passe
  // ========================================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 tentatives par heure
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponse> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ========================================
  // SCRUM-40: Authentification à deux facteurs (2FA)
  // ========================================

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  async generate2FA(
    @GetUser() user: RequestUser,
  ): Promise<TwoFactorSetupResponse> {
    return this.authService.generate2FASecret(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2FA(
    @GetUser() user: RequestUser,
    @Body() verify2FADto: Verify2FADto,
  ): Promise<TwoFactorResponse> {
    return this.authService.enable2FA(user.userId, verify2FADto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @GetUser() user: RequestUser,
    @Body() verify2FADto: Verify2FADto,
  ): Promise<TwoFactorResponse> {
    return this.authService.verify2FA(user.userId, verify2FADto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2FA(@GetUser() user: RequestUser): Promise<TwoFactorResponse> {
    return this.authService.disable2FA(user.userId);
  }

  // ========================================
  // Bonus: Refresh Token & Logout
  // ========================================

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<RefreshTokenResponse> {
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshToken(refreshTokenDto, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: { refreshToken: string },
  ): Promise<PasswordResetResponse> {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @GetUser() user: RequestUser,
  ): Promise<PasswordResetResponse> {
    return this.authService.logoutAll(user.userId);
  }

  @Get('health')
  healthCheck() {
    return {
      success: true,
      message: "Le module d'authentification fonctionne",
      timestamp: new Date().toISOString(),
    };
  }
}
