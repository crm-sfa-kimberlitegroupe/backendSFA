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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SKUsService, CreateSKUDto, UpdateSKUDto, SKUFilters } from './skus.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('skus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SKUsController {
  constructor(private readonly skusService: SKUsService) {}

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  async findAll(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    const filters: SKUFilters = {
      category,
      brand,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      search,
    };

    return this.skusService.findAll(filters);
  }

  @Get('stats')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async getStats() {
    return this.skusService.getStats();
  }

  @Get('categories')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  async getCategories() {
    return this.skusService.getCategories();
  }

  @Get('brands')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  async getBrands() {
    return this.skusService.getBrands();
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  async findOne(@Param('id') id: string) {
    return this.skusService.findOne(id);
  }

  @Get('ean/:ean')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP, RoleEnum.REP)
  async findByEan(@Param('ean') ean: string) {
    return this.skusService.findByEan(ean);
  }

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSKUDto: CreateSKUDto) {
    return this.skusService.create(createSKUDto);
  }

  @Put(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async update(@Param('id') id: string, @Body() updateSKUDto: UpdateSKUDto) {
    return this.skusService.update(id, updateSKUDto);
  }

  @Put(':id/toggle-active')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUP)
  async toggleActive(@Param('id') id: string) {
    return this.skusService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.SUP)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.skusService.remove(id);
  }
}
