import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodEnum } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Méthode de paiement',
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.CASH,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  method: PaymentMethodEnum;

  @ApiProperty({
    description: 'Montant payé',
    example: 15000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Date et heure du paiement (ISO 8601)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Référence de transaction (pour Mobile Money, Bank Transfer)',
    example: 'TRX123456789',
  })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées supplémentaires (JSON)',
    example: { operator: 'Orange Money', phone: '+237690000000' },
  })
  @IsOptional()
  meta?: any;
}
