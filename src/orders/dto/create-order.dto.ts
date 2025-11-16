import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatusEnum } from '@prisma/client';
import { CreateOrderLineDto } from './create-order-line.dto';
import { CreatePaymentDto } from './create-payment.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID du point de vente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  outletId: string;

  @ApiPropertyOptional({
    description:
      "ID de la visite (si vente effectuée dans le contexte d'une visite)",
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  visitId?: string;

  @ApiPropertyOptional({
    description: 'Statut de la vente',
    enum: OrderStatusEnum,
    example: OrderStatusEnum.DRAFT,
    default: OrderStatusEnum.DRAFT,
  })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @ApiProperty({
    description: 'Lignes de vente (produits vendus)',
    type: [CreateOrderLineDto],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  orderLines: CreateOrderLineDto[];

  @ApiPropertyOptional({
    description: 'Paiements associés à la vente',
    type: [CreatePaymentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments?: CreatePaymentDto[];
}
