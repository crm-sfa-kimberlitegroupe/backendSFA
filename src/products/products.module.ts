import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ProductHierarchyService } from './services/product-hierarchy.service';
import { SKUGroupService } from './services/sku-group.service';
import { ProductHierarchyController } from './controllers/product-hierarchy.controller';
import { SKUGroupController } from './controllers/sku-group.controller';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  providers: [ProductHierarchyService, SKUGroupService],
  controllers: [ProductHierarchyController, SKUGroupController],
  exports: [ProductHierarchyService, SKUGroupService],
})
export class ProductsModule {}
