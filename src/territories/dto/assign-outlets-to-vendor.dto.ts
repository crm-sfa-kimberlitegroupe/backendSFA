import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignOutletsToVendorDto {
  @IsUUID()
  vendorId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  outletIds: string[];
}
