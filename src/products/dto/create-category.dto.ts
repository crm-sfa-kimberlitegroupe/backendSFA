import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Code unique de la catégorie', example: 'CAT001' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nom de la catégorie', example: 'Boissons' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description de la catégorie' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
