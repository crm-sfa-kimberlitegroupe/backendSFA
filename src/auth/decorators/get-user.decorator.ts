import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../interfaces';

/**
 * Custom decorator to extract user from request
 * Usage: @GetUser() user: RequestUser
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data ? user?.[data as keyof typeof user] : user;
  },
);
