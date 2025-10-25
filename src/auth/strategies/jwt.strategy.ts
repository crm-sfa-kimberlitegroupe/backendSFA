import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload, RequestUser } from '../interfaces';
import { AUTH_ERRORS } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-changez-moi',
    };
    super(options);
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: user.role, // ✅ Ajouter le rôle pour le RolesGuard
      territoryId: payload.territoryId || user.territoryId, // ✅ Ajouter le territoryId du JWT ou de la DB
    };
  }
}
