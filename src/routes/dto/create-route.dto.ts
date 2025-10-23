import { IsString, IsArray, IsDateString, ArrayMinSize } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  userId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  outletIds: string[];
}
