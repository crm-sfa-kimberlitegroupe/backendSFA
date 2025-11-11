import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PromotionService } from './services/promotion.service';
import { PromotionController } from './controllers/promotion.controller';

@Module({
  imports: [PrismaModule],
  providers: [PromotionService],
  controllers: [PromotionController],
  exports: [PromotionService],
})
export class PromotionsModule {}
