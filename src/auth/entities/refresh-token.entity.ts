export class RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  ip?: string;
  userAgent?: string;
}
