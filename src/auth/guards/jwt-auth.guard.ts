import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AUTH_CONSTANTS, AUTH_ERRORS } from '../constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard(AUTH_CONSTANTS.JWT_STRATEGY) {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
    return user as TUser;
  }
}
