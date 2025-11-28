import { IsArray, IsUUID } from 'class-validator';

export class UpdateVisitOrdersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds: string[];
}

export class UpdateVisitMerchandisingDto {
  @IsArray()
  @IsUUID('4', { each: true })
  merchIds: string[];
}
