import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsObject,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO pour une question de merchandising avec note
export class MerchQuestionDto {
  @IsString()
  questionId: string;

  @IsString()
  question: string;

  @IsInt()
  @Min(0)
  @Max(5)
  rating: number; // Note de 0 a 5

  @IsOptional()
  @IsString()
  comment?: string; // Commentaire optionnel
}

export class CreateMerchCheckDto {
  // Questions avec notes (nouveau format)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchQuestionDto)
  questions?: MerchQuestionDto[];

  // Ancien format checklist (garde pour compatibilite)
  @IsOptional()
  @IsObject()
  checklist?: Record<string, any>;

  @IsOptional()
  @IsObject()
  planogram?: Record<string, any>;

  // Score global (calcule automatiquement si questions fournies)
  @IsOptional()
  @IsNumber()
  score?: number;

  // Note generale optionnelle
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  photos?: Array<{
    fileKey: string;
    lat?: number;
    lng?: number;
    meta?: Record<string, any>;
  }>;
}

export class CreateVisitDto {
  @IsUUID()
  outletId: string;

  @IsOptional()
  @IsNumber()
  checkinLat?: number;

  @IsOptional()
  @IsNumber()
  checkinLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  // Données optionnelles de merchandising
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMerchCheckDto)
  merchCheck?: CreateMerchCheckDto;

  // ID de vente optionnel (si une vente a été créée pendant la visite)
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

// DTO pour créer une visite complète (check-in + check-out en une fois)
export class CreateCompleteVisitDto {
  @IsUUID()
  outletId: string;

  @IsOptional()
  @IsNumber()
  checkinLat?: number;

  @IsOptional()
  @IsNumber()
  checkinLng?: number;

  @IsOptional()
  @IsNumber()
  checkoutLat?: number;

  @IsOptional()
  @IsNumber()
  checkoutLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  // Données optionnelles de merchandising
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMerchCheckDto)
  merchCheck?: CreateMerchCheckDto;

  // ID de vente optionnel
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

// DTO pour compléter une visite existante
export class CompleteVisitDto {
  @IsUUID()
  visitId: string;

  @IsOptional()
  @IsNumber()
  checkoutLat?: number;

  @IsOptional()
  @IsNumber()
  checkoutLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  // Données optionnelles de merchandising
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMerchCheckDto)
  merchCheck?: CreateMerchCheckDto;

  // ID de vente optionnel
  @IsOptional()
  @IsUUID()
  orderId?: string;

  // ID de merchandising optionnel
  @IsOptional()
  @IsUUID()
  merchId?: string;
}

export class CheckInDto {
  @IsUUID()
  outletId: string;

  @IsOptional()
  @IsNumber()
  checkinLat?: number;

  @IsOptional()
  @IsNumber()
  checkinLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutDto {
  @IsUUID()
  visitId: string;

  @IsOptional()
  @IsNumber()
  checkoutLat?: number;

  @IsOptional()
  @IsNumber()
  checkoutLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}
