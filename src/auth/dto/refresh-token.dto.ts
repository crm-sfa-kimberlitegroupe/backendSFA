import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pour le rafraîchissement du token
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token requis' })
  refreshToken: string;
}
