import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  level?: string; // SECTEUR par défaut

  @IsUUID()
  @IsOptional()
  parentId?: string; // ID du territoire parent (ZONE)
}
