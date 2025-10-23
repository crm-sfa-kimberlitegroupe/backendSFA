import { IsUUID } from 'class-validator';

export class AssignSectorToVendorDto {
  @IsUUID()
  vendorId: string;

  @IsUUID()
  sectorId: string;
}
