import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ProductHierarchyService } from '../services/product-hierarchy.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
} from '../dto/sub-category.dto';
import { CreateBrandDto, UpdateBrandDto } from '../dto/brand.dto';
import { CreateSubBrandDto, UpdateSubBrandDto } from '../dto/sub-brand.dto';
import {
  CreatePackFormatDto,
  UpdatePackFormatDto,
} from '../dto/pack-format.dto';
import { CreatePackSizeDto, UpdatePackSizeDto } from '../dto/pack-size.dto';
import { CreateSKUDto, UpdateSKUDto, SKUQueryDto } from '../dto/sku.dto';

@ApiTags('Product Hierarchy')
@ApiBearerAuth()
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductHierarchyController {
  constructor(
    private readonly productHierarchyService: ProductHierarchyService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ========================================
  // CATEGORIES
  // ========================================

  @Get('categories')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'List all categories' })
  async listCategories(@Query('active') active?: boolean) {
    return await this.productHierarchyService.getCategories(active);
  }

  @Post('categories')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return await this.productHierarchyService.createCategory(dto);
  }

  @Get('categories/:id')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategory(@Param('id') id: string) {
    return await this.productHierarchyService.getCategory(id);
  }

  @Put('categories/:id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return await this.productHierarchyService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string) {
    return await this.productHierarchyService.deleteCategory(id);
  }

  @Patch('categories/:id/toggle-status')
  @Roles('SUP')
  @ApiOperation({ summary: 'Toggle category status' })
  async toggleCategoryStatus(@Param('id') id: string) {
    return await this.productHierarchyService.toggleCategoryStatus(id);
  }

  // ========================================
  // SUB-CATEGORIES
  // ========================================

  @Get('sub-categories')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'List all sub-categories' })
  async listSubCategories(
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: boolean,
  ) {
    return await this.productHierarchyService.getSubCategories(
      categoryId,
      active,
    );
  }

  @Post('sub-categories')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new sub-category' })
  async createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return await this.productHierarchyService.createSubCategory(dto);
  }

  @Get('sub-categories/:id')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get sub-category by ID' })
  async getSubCategory(@Param('id') id: string) {
    return await this.productHierarchyService.getSubCategory(id);
  }

  @Put('sub-categories/:id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Update sub-category' })
  async updateSubCategory(
    @Param('id') id: string,
    @Body() dto: UpdateSubCategoryDto,
  ) {
    return await this.productHierarchyService.updateSubCategory(id, dto);
  }

  // ========================================
  // BRANDS
  // ========================================

  @Get('brands')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'List all brands' })
  async listBrands(
    @Query('subCategoryId') subCategoryId?: string,
    @Query('active') active?: boolean,
  ) {
    return await this.productHierarchyService.getBrands(subCategoryId, active);
  }

  @Post('brands')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new brand' })
  async createBrand(@Body() dto: CreateBrandDto) {
    return await this.productHierarchyService.createBrand(dto);
  }

  // ========================================
  // SUB-BRANDS
  // ========================================

  @Post('sub-brands')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new sub-brand' })
  async createSubBrand(@Body() dto: CreateSubBrandDto) {
    return await this.productHierarchyService.createSubBrand(dto);
  }

  // ========================================
  // PACK FORMATS
  // ========================================

  @Get('pack-formats')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Get all pack formats' })
  async getPackFormats(
    @Query('active') active?: string,
    @Query('brandId') brandId?: string,
  ) {
    return await this.productHierarchyService.getPackFormats(
      active === 'true',
      brandId,
    );
  }

  @Post('pack-formats')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new pack format' })
  async createPackFormat(@Body() dto: CreatePackFormatDto) {
    return await this.productHierarchyService.createPackFormat(dto);
  }

  // ========================================
  // PACK SIZES
  // ========================================

  @Get('pack-sizes')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Get all pack sizes' })
  async getPackSizes(
    @Query('active') active?: string,
    @Query('packFormatId') packFormatId?: string,
  ) {
    return await this.productHierarchyService.getPackSizes(
      active === 'true',
      packFormatId,
    );
  }

  @Post('pack-sizes')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new pack size' })
  async createPackSize(@Body() dto: CreatePackSizeDto) {
    return await this.productHierarchyService.createPackSize(dto);
  }

  // ========================================
  // SKU
  // ========================================

  @Get('skus')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'List SKUs with filters' })
  async listSKUs(@Query() query: SKUQueryDto) {
    return await this.productHierarchyService.getSKUs(query);
  }

  @Post('skus')
  @Roles('SUP')
  @ApiOperation({ summary: 'Create a new SKU' })
  async createSKU(@Body() dto: CreateSKUDto) {
    return await this.productHierarchyService.createSKU(dto);
  }

  @Get('skus/:id')
  @Roles('ADMIN', 'SUP', 'REP')
  @ApiOperation({ summary: 'Get SKU by ID' })
  async getSKU(@Param('id') id: string) {
    return await this.productHierarchyService.getSKUWithFullHierarchy(id);
  }

  @Put('skus/:id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Update SKU' })
  async updateSKU(@Param('id') id: string, @Body() dto: UpdateSKUDto) {
    return await this.productHierarchyService.updateSKU(id, dto);
  }

  @Delete('skus/:id')
  @Roles('SUP')
  @ApiOperation({ summary: 'Delete SKU' })
  async deleteSKU(@Param('id') id: string) {
    return await this.productHierarchyService.deleteSKU(id);
  }

  @Patch('skus/:id/toggle-status')
  @Roles('SUP')
  @ApiOperation({ summary: 'Toggle SKU status' })
  async toggleSKUStatus(@Param('id') id: string) {
    return await this.productHierarchyService.toggleSKUStatus(id);
  }

  @Post('skus/upload-image')
  @Roles('SUP', 'ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload SKU image to Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadSKUImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucune image fournie');
    }

    console.log('📤 [ProductHierarchyController] Upload image SKU:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    try {
      const imageUrl = await this.cloudinaryService.uploadImage(
        file,
        'sfa-products',
      );

      console.log('✅ [ProductHierarchyController] Image uploadée:', imageUrl);

      return {
        success: true,
        imageUrl,
        message: 'Image uploadée avec succès',
      };
    } catch (error) {
      console.error('❌ [ProductHierarchyController] Erreur upload:', error);
      throw new BadRequestException(
        'Erreur lors de l upload de l image: ' + error.message,
      );
    }
  }

  // ========================================
  // UTILITIES
  // ========================================

  @Get('hierarchy/tree')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get full hierarchy tree' })
  async getFullHierarchyTree() {
    return await this.productHierarchyService.getFullHierarchyTree();
  }

  @Get('statistics')
  @Roles('ADMIN', 'SUP')
  @ApiOperation({ summary: 'Get product statistics' })
  async getStatistics() {
    return await this.productHierarchyService.getProductStatistics();
  }
}
