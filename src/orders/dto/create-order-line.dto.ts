import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderLineDto {
  @ApiProperty({
    description: 'ID du SKU (format de produit)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  skuId: string;

  @ApiProperty({
    description: 'Quantité vendue',
    example: 10,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({
    description: 'Prix unitaire HT (sera récupéré du SKU si non fourni)',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiProperty({
    description:
      'Taux de TVA en pourcentage (sera récupéré du SKU si non fourni)',
    example: 19.25,
  })
  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @ApiPropertyOptional({
    description: 'ID de la promotion appliquée (optionnel)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  promotionId?: string;

  @ApiPropertyOptional({
    description: 'Prix unitaire original avant promotion',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  originalUnitPrice?: number;

  @ApiPropertyOptional({
    description: 'Montant de la remise',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;
}
