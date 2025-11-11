import { IsUUID, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSellerSKUGroupMappingDto {
  @ApiProperty({ description: 'Seller ID' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ description: 'SKU Group ID' })
  @IsUUID()
  skuGroupId: string;

  @ApiProperty({ description: 'Route Plan ID' })
  @IsUUID()
  routePlanId: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSKUGroupDto {
  @ApiPropertyOptional({ description: 'Group name' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AddSKUsToGroupDto {
  @ApiProperty({ description: 'Array of SKU IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  skuIds: string[];
}
