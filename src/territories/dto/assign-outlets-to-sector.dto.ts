import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignOutletsToSectorDto {
  @IsUUID()
  sectorId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  outletIds: string[];
}
