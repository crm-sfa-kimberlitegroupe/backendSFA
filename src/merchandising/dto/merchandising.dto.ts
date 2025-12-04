import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO pour un element de merchandising (verification d'un produit)
export class MerchCheckItemDto {
  @IsUUID()
  skuId: string;

  @IsBoolean()
  isVisible: boolean;

  @IsBoolean()
  isPriceCorrect: boolean;

  @IsBoolean()
  isWellStocked: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}

// DTO pour une photo de merchandising
export class MerchPhotoDto {
  @IsString()
  fileKey: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  meta?: Record<string, unknown>;
}

// DTO pour creer un merchandising complet
export class CreateMerchandisingDto {
  @IsUUID()
  visitId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchCheckItemDto)
  items: MerchCheckItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchPhotoDto)
  photos?: MerchPhotoDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO pour mettre a jour un merchandising
export class UpdateMerchandisingDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchCheckItemDto)
  items?: MerchCheckItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchPhotoDto)
  photos?: MerchPhotoDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO pour ajouter des photos
export class AddPhotosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchPhotoDto)
  photos: MerchPhotoDto[];
}
