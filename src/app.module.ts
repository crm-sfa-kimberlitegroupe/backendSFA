import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { TerritoriesModule } from './territories/territories.module';
import { OutletsModule } from './outlets/outlets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TerritoriesModule,
    OutletsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
