import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AUTH_CONSTANTS, AUTH_ERRORS } from '../constants';

/**
 * JWT Authentication Guard
 * Protects routes by requiring a valid JWT token
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(AUTH_CONSTANTS.JWT_STRATEGY) {
  /**
   * Determines if the request can proceed
   * @param context - Execution context
   * @returns Boolean or Promise/Observable of boolean
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  /**
   * Handles authentication errors
   * @param err - Error object
   * @param user - User object from validation
   * @throws UnauthorizedException with custom message
   */
  handleRequest<TUser = any>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
    return user as TUser;
  }
}
