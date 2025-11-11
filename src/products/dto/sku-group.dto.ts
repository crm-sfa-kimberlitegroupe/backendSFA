import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSKUGroupDto {
  @ApiProperty({ description: 'Group code', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  code: string;

  @ApiProperty({ description: 'Group name', maxLength: 50 })
  @IsString()
  @Length(1, 50)
  name: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSKUGroupDto {
  @ApiPropertyOptional({ description: 'Group name', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
