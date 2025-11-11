import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ description: 'Code unique de la marque', example: 'BRAND001' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nom de la marque', example: 'Coca-Cola' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description de la marque' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID de la sous-catégorie parente' })
  @IsUUID()
  subCategoryId: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
