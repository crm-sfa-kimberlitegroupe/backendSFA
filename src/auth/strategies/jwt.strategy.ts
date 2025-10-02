import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload, RequestUser } from '../interfaces';
import { AUTH_ERRORS } from '../constants';

/**
 * JWT authentication strategy
 * Validates JWT tokens and attaches user information to requests
 */
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

  /**
   * Validates the JWT payload and returns user data
   * This method is called automatically by Passport after JWT verification
   * @param payload - Decoded JWT payload
   * @returns User data to be attached to the request
   * @throws UnauthorizedException if user is not found
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
