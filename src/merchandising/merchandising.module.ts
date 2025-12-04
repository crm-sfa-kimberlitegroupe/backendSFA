import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MerchandisingController } from './merchandising.controller';
import { MerchandisingService } from './merchandising.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  ],
  controllers: [MerchandisingController],
  providers: [MerchandisingService],
  exports: [MerchandisingService],
})
export class MerchandisingModule {}
