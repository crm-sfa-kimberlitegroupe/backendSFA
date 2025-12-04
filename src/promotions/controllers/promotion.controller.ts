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
import { PromotionService } from '../services/promotion.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  AddSKUsToPromotionDto,
} from '../dto/promotion.dto';

@ApiTags('Promotions')
@ApiBearerAuth()
@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  // ========================================
  // CRUD PROMOTIONS
  // ========================================

  @Post()
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new promotion' })
  async createPromotion(@Body() dto: CreatePromotionDto) {
    return await this.promotionService.createPromotion(dto);
  }

  @Get()
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'List all promotions' })
  async listPromotions(
    @Query('active') active?: boolean,
    @Query('current') current?: boolean,
  ) {
    return await this.promotionService.getPromotions(active, current);
  }

  @Get('active')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Get active promotions' })
  async getActivePromotions() {
    return await this.promotionService.getPromotions(true, true);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get promotion by ID' })
  async getPromotion(@Param('id') id: string) {
    return await this.promotionService.getPromotion(id);
  }

  @Put(':id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Update promotion' })
  async updatePromotion(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto) {
    return await this.promotionService.updatePromotion(id, dto);
  }

  @Delete(':id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Delete promotion' })
  async deletePromotion(@Param('id') id: string) {
    return await this.promotionService.deletePromotion(id);
  }

  // ========================================
  // SKU MANAGEMENT
  // ========================================

  @Post(':id/skus')
  @Roles('SUP')
  @ApiOperation({ summary: 'Add SKUs to promotion' })
  async addSKUsToPromotion(
    @Param('id') id: string,
    @Body() dto: AddSKUsToPromotionDto,
  ) {
    return await this.promotionService.addSKUsToPromotion(id, dto.skuIds);
  }

  @Delete(':id/skus/:skuId')
  @Roles('SUP')
  @ApiOperation({ summary: 'Remove SKU from promotion' })
  async removeSKUFromPromotion(
    @Param('id') id: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.promotionService.removeSKUFromPromotion(id, skuId);
  }

  // ========================================
  // PROMOTION APPLICATION
  // ========================================

  @Get('sku/:skuId/active')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Get active promotions for SKU' })
  async getActivePromotionsForSKU(@Param('skuId') skuId: string) {
    return await this.promotionService.getActivePromotionsForSKU(skuId);
  }

  @Post('calculate-price')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Calculate promotional price for SKU' })
  async calculatePromotionalPrice(
    @Body()
    body: {
      skuId: string;
      unitPrice: number;
      quantity: number;
    },
  ) {
    return await this.promotionService.applyBestPromotionToItem(
      body.skuId,
      body.unitPrice,
      body.quantity,
    );
  }
}
