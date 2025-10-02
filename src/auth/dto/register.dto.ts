import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { AUTH_CONSTANTS } from '../constants';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, {
    message: `Le mot de passe doit contenir au moins ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} caractères`,
  })
  @MaxLength(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH, {
    message: `Le mot de passe ne doit pas dépasser ${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} caractères`,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  password: string;

  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le prénom ne doit pas dépasser 50 caractères' })
  firstName: string;

  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
  lastName: string;
}
