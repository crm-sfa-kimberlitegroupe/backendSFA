import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PeriodEnum {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class KpiQueryDto {
  @ApiProperty({
    description: 'Période de calcul',
    enum: PeriodEnum,
    required: false,
    default: PeriodEnum.MONTH,
  })
  @IsOptional()
  @IsEnum(PeriodEnum)
  period?: PeriodEnum = PeriodEnum.MONTH;

  @ApiProperty({
    description: 'Date de début (ISO 8601) - Requis si period=custom',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601) - Requis si period=custom',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'ID du vendeur (pour filtrer par vendeur)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({
    description: 'ID du secteur (pour filtrer par secteur)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @ApiProperty({
    description: 'ID du territoire (pour filtrer par territoire)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  territoryId?: string;
}
