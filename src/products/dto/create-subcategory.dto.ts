import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubCategoryDto {
  @ApiProperty({ description: 'Code unique de la sous-catégorie', example: 'SUBCAT001' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nom de la sous-catégorie', example: 'Sodas' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description de la sous-catégorie' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID de la catégorie parente' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
