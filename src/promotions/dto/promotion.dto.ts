import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Length,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export enum PromotionLevel {
  CATEGORY = 'CATEGORY',
  BRAND = 'BRAND',
  SUB_BRAND = 'SUB_BRAND',
  PACK_FORMAT = 'PACK_FORMAT',
}

export class CreatePromotionDto {
  @ApiProperty({ description: 'Promotion code', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  code: string;

  @ApiProperty({ description: 'Promotion name', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Promotion description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ description: 'Promotion value' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Apply to level', enum: PromotionLevel })
  @IsOptional()
  @IsEnum(PromotionLevel)
  applyToLevel?: PromotionLevel;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Sub-brand ID' })
  @IsOptional()
  @IsUUID()
  subBrandId?: string;

  @ApiPropertyOptional({ description: 'Pack format ID' })
  @IsOptional()
  @IsUUID()
  packFormatId?: string;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'SKU IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skuIds?: string[];
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({ description: 'Promotion name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Promotion description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Promotion type', enum: PromotionType })
  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @ApiPropertyOptional({ description: 'Promotion value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;
}

export class AddSKUsToPromotionDto {
  @ApiProperty({ description: 'Array of SKU IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  skuIds: string[];
}
