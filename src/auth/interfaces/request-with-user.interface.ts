import { Request } from 'express';

export interface RequestUser {
  userId: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
