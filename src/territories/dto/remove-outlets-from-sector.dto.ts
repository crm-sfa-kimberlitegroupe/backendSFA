import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class RemoveOutletsFromSectorDto {
  @IsUUID()
  sectorId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  outletIds: string[];
}
