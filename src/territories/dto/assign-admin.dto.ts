import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignAdminDto {
  @IsUUID()
  @IsNotEmpty()
  adminId: string;
}
