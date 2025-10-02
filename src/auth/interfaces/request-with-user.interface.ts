import { Request } from 'express';

/**
 * User data attached to request after JWT validation
 */
export interface RequestUser {
  userId: string;
  email: string;
}

/**
 * Extended Express Request with authenticated user
 */
export interface RequestWithUser extends Request {
  user: RequestUser;
}
