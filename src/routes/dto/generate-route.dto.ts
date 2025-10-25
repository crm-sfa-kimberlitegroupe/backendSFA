import { IsUUID, IsDateString, IsOptional, IsArray } from 'class-validator';

export class GenerateRouteDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  outletIds?: string[]; // Si vide, prendre tous les PDV du secteur

  @IsOptional()
  optimize?: boolean; // Optimiser l'ordre des visites
}
