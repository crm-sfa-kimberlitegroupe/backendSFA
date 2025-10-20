import { PartialType } from '@nestjs/mapped-types';
import { CreateOutletDto } from './create-outlet.dto';
import { IsOptional, IsString, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOutletDto extends PartialType(CreateOutletDto) {
  @ApiPropertyOptional({ description: 'Date de validation' })
  @IsOptional()
  @IsDate()
  validatedAt?: Date;

  @ApiPropertyOptional({ description: 'ID du validateur' })
  @IsOptional()
  @IsString()
  validatedBy?: string;
}
