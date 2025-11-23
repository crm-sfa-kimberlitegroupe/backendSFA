import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class GenerateMultiDayRouteDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  startDate: string;

  @IsNumber()
  @Min(1)
  @Max(30)
  numberOfDays: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  outletsPerDay?: number;

  @IsOptional()
  @IsBoolean()
  optimize?: boolean;

  @IsOptional()
  @IsUUID()
  sectorId?: string; // ID du secteur du vendeur
}
