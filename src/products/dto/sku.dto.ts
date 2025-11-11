import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Length,
  Min,
  Max,
  Matches,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSKUDto {
  @ApiProperty({ description: 'SKU code', maxLength: 50 })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiPropertyOptional({ description: 'EAN code', maxLength: 13 })
  @IsOptional()
  @IsString()
  @Length(13, 13)
  @Matches(/^\d{13}$/)
  ean?: string;

  @ApiPropertyOptional({ description: 'Full description', maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  fullDescription?: string;

  @ApiProperty({ description: 'Short description', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  shortDescription: string;

  @ApiProperty({ description: 'Pack size ID' })
  @IsUUID()
  packSizeId: string;

  @ApiPropertyOptional({ description: 'Barcode', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  barCode?: string;

  @ApiPropertyOptional({
    description: 'Base unit of measure',
    default: 'Piece',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  baseUom?: string;

  @ApiPropertyOptional({
    description: 'Default unit of measure',
    default: 'Piece',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  defaultUom?: string;

  @ApiProperty({ description: 'Price HT' })
  @IsNumber()
  @Min(0)
  priceHt: number;

  @ApiProperty({ description: 'VAT rate' })
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate: number;

  @ApiPropertyOptional({ description: 'Photo URL' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ description: 'Weight' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Volume' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiPropertyOptional({ description: 'Is saleable' })
  @IsOptional()
  @IsBoolean()
  isSaleable?: boolean;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSKUDto {
  @ApiPropertyOptional({ description: 'Full description', maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  fullDescription?: string;

  @ApiPropertyOptional({ description: 'Short description', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Pack size ID' })
  @IsOptional()
  @IsUUID()
  packSizeId?: string;

  @ApiPropertyOptional({ description: 'Barcode', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  barCode?: string;

  @ApiPropertyOptional({ description: 'Base unit of measure' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  baseUom?: string;

  @ApiPropertyOptional({ description: 'Default unit of measure' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  defaultUom?: string;

  @ApiPropertyOptional({ description: 'Price HT' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceHt?: number;

  @ApiPropertyOptional({ description: 'VAT rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @ApiPropertyOptional({ description: 'Photo URL' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ description: 'Weight' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Volume' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiPropertyOptional({ description: 'Is saleable' })
  @IsOptional()
  @IsBoolean()
  isSaleable?: boolean;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SKUQueryDto {
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'SubCategory ID' })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'SubBrand ID' })
  @IsOptional()
  @IsUUID()
  subBrandId?: string;

  @ApiPropertyOptional({ description: 'PackFormat ID' })
  @IsOptional()
  @IsUUID()
  packFormatId?: string;

  @ApiPropertyOptional({ description: 'PackSize ID' })
  @IsOptional()
  @IsUUID()
  packSizeId?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Is saleable' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSaleable?: boolean;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
