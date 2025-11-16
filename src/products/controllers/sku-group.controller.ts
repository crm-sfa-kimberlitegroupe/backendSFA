import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SKUGroupService } from '../services/sku-group.service';
import { CreateSKUGroupDto, UpdateSKUGroupDto } from '../dto/sku-group.dto';
import {
  CreateSellerSKUGroupMappingDto,
  AddSKUsToGroupDto,
} from '../dto/seller-sku-group-mapping.dto';

@ApiTags('SKU Groups')
@ApiBearerAuth()
@Controller('admin/sku-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SKUGroupController {
  constructor(private readonly skuGroupService: SKUGroupService) {}

  // ========================================
  // SKU GROUPS
  // ========================================

  @Get()
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'List all SKU groups' })
  async listGroups(@Query('active') active?: boolean) {
    return await this.skuGroupService.getSKUGroups(active);
  }

  @Post()
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new SKU group' })
  async createGroup(@Body() dto: CreateSKUGroupDto) {
    return await this.skuGroupService.createSKUGroup(dto);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get SKU group by ID' })
  async getGroup(@Param('id') id: string) {
    return await this.skuGroupService.getSKUGroup(id);
  }

  @Put(':id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Update SKU group' })
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateSKUGroupDto) {
    return await this.skuGroupService.updateSKUGroup(id, dto);
  }

  @Delete(':id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Delete SKU group' })
  async deleteGroup(@Param('id') id: string) {
    return await this.skuGroupService.deleteSKUGroup(id);
  }

  // ========================================
  // SKU MAPPINGS
  // ========================================

  @Post(':id/skus')
  @Roles('SUP')
  @ApiOperation({ summary: 'Add SKUs to group' })
  async addSKUsToGroup(
    @Param('id') id: string,
    @Body() dto: AddSKUsToGroupDto,
  ) {
    return await this.skuGroupService.addSKUsToGroup(id, dto.skuIds);
  }

  @Delete(':id/skus/:skuId')
  @Roles('SUP')
  @ApiOperation({ summary: 'Remove SKU from group' })
  async removeSKUFromGroup(
    @Param('id') id: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.skuGroupService.removeSKUFromGroup(id, skuId);
  }

  @Get(':id/skus')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get all SKUs in group' })
  async getSKUsInGroup(@Param('id') id: string) {
    return await this.skuGroupService.getSKUsInGroup(id);
  }

  // ========================================
  // SELLER MAPPINGS
  // ========================================

  @Post('seller-mappings')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Assign group to seller' })
  async assignGroupToSeller(@Body() dto: CreateSellerSKUGroupMappingDto) {
    return await this.skuGroupService.assignGroupToSeller(dto);
  }

  @Delete('seller-mappings/:id')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Remove seller mapping' })
  async removeSellerMapping(@Param('id') id: string) {
    return await this.skuGroupService.removeSellerMapping(id);
  }

  @Get('seller-mappings')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'List seller mappings' })
  async listSellerMappings(
    @Query('sellerId') sellerId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return await this.skuGroupService.getSellerMappings(sellerId, groupId);
  }

  @Get('seller/:sellerId/available-skus')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Get available SKUs for seller' })
  async getAvailableSKUsForSeller(
    @Param('sellerId') sellerId: string,
    @Query('routePlanId') routePlanId?: string,
  ) {
    return await this.skuGroupService.getAvailableSKUsForSeller(sellerId, routePlanId);
  }
}
