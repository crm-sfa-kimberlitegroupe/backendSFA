import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductHierarchyService } from './services/product-hierarchy.service';
import { SKUGroupService } from './services/sku-group.service';
import { ProductHierarchyController } from './controllers/product-hierarchy.controller';
import { SKUGroupController } from './controllers/sku-group.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProductHierarchyService, SKUGroupService],
  controllers: [ProductHierarchyController, SKUGroupController],
  exports: [ProductHierarchyService, SKUGroupService],
})
export class ProductsModule {}
