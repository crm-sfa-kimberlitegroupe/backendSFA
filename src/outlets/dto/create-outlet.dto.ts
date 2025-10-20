import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutletStatusEnum } from '@prisma/client';
import { OsmMetadata } from './osm-metadata.interface';

export class CreateOutletDto {
  @ApiPropertyOptional({
    description: 'Code unique du PDV (auto-généré si non fourni)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Nom du point de vente' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Canal de distribution' })
  @IsNotEmpty()
  @IsString()
  channel: string;

  @ApiPropertyOptional({ description: 'Segment du PDV' })
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional({ description: 'Adresse complète' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude GPS' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude GPS' })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Horaires d ouverture' })
  @IsOptional()
  @IsObject()
  openHours?: {
    days?: string[];
    opening?: string;
    closing?: string;
  };

  @ApiPropertyOptional({
    description: 'Statut du PDV',
    enum: OutletStatusEnum,
    default: OutletStatusEnum.PENDING,
  })
  @IsOptional()
  @IsEnum(OutletStatusEnum)
  status?: OutletStatusEnum;

  @ApiProperty({ description: 'ID du territoire' })
  @IsNotEmpty()
  @IsString()
  territoryId: string;

  @ApiPropertyOptional({ description: 'ID de l utilisateur proposant le PDV' })
  @IsOptional()
  @IsString()
  proposedBy?: string;

  @ApiPropertyOptional({ description: 'Commentaire de validation' })
  @IsOptional()
  @IsString()
  validationComment?: string;

  @ApiPropertyOptional({ description: 'ID OSM du lieu' })
  @IsOptional()
  @IsString()
  osmPlaceId?: string;

  @ApiPropertyOptional({ description: 'Métadonnées OSM' })
  @IsOptional()
  @IsObject()
  osmMetadata?: OsmMetadata;
}
