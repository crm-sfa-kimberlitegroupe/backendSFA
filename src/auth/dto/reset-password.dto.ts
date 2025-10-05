import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { AUTH_CONSTANTS } from '../constants';

/**
 * DTO pour la réinitialisation du mot de passe
 */
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token requis' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, {
    message: `Le mot de passe doit contenir au moins ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} caractères`,
  })
  @MaxLength(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH, {
    message: `Le mot de passe ne doit pas dépasser ${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} caractères`,
  })
  newPassword: string;
}
