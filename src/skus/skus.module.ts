import { Module } from '@nestjs/common';
import { SKUsController } from './skus.controller';
import { SKUsService } from './skus.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SKUsController],
  providers: [SKUsService],
  exports: [SKUsService],
})
export class SKUsModule {}
