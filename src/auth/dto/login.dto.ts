import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AUTH_CONSTANTS } from '../constants';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, {
    message: `Le mot de passe doit contenir au moins ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} caractères`,
  })
  password: string;
}
