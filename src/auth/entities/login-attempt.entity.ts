export class LoginAttempt {
  id: string;
  userId?: string;
  email: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
  createdAt: Date;
}
