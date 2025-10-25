import { Request } from 'express';

export interface RequestUser {
  userId: string;
  email: string;
  role?: string;
  territoryId?: string;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
