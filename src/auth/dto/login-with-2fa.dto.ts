import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  Length,
} from 'class-validator';

/**
 * DTO pour la connexion avec 2FA
 */
export class LoginWith2FADto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Le code 2FA doit contenir 6 chiffres' })
  twoFactorCode?: string;
}
