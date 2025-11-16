import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { TerritoriesModule } from './territories/territories.module';
import { OutletsModule } from './outlets/outlets.module';
import { RoutesModule } from './routes/routes.module';
// import { SKUsModule } from './skus/skus.module'; // Remplacé par ProductsModule
import { VendorStockModule } from './vendor-stock/vendor-stock.module';
import { ProductsModule } from './products/products.module';
import { PromotionsModule } from './promotions/promotions.module';
import { OrdersModule } from './orders/orders.module';

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
    RoutesModule,
    // SKUsModule, // Temporairement désactivé - remplacé par ProductsModule
    VendorStockModule,
    ProductsModule,
    PromotionsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
