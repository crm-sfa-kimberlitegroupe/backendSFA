import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['REP', 'SUP', 'ADMIN'], { message: 'Rôle invalide' })
  role?: string;

  @IsOptional()
  @IsString()
  territoryId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  assignedSectorId?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
