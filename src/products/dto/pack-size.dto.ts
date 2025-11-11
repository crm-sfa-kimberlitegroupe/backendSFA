import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackSizeDto {
  @ApiProperty({ description: 'PackSize code', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  code: string;

  @ApiProperty({ description: 'PackSize name', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Display name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @ApiProperty({ description: 'Parent pack format ID' })
  @IsUUID()
  packFormatId: string;

  @ApiPropertyOptional({ description: 'Sort order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePackSizeDto {
  @ApiPropertyOptional({ description: 'PackSize name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Display name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Parent pack format ID' })
  @IsOptional()
  @IsUUID()
  packFormatId?: string;

  @ApiPropertyOptional({ description: 'Sort order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
