import { Module } from '@nestjs/common';
import { RoutePlansController } from './route-plans.controller';
import { RoutePlansService } from './route-plans.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoutePlansController],
  providers: [RoutePlansService],
  exports: [RoutePlansService],
})
export class RoutePlansModule {}
