import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * DTO pour la vérification du code 2FA
 */
export class Verify2FADto {
  @IsString()
  @IsNotEmpty({ message: 'Code 2FA requis' })
  @Length(6, 6, { message: 'Le code 2FA doit contenir 6 chiffres' })
  code: string;
}
