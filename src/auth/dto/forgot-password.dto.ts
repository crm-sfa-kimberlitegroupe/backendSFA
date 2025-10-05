import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO pour la demande de réinitialisation de mot de passe
 */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;
}
