import { Module } from '@nestjs/common';
import { VendorStockController } from './vendor-stock.controller';
import { VendorStockService } from './vendor-stock.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendorStockController],
  providers: [VendorStockService],
  exports: [VendorStockService],
})
export class VendorStockModule {}
