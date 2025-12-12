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
// import { SKUsModule } from './skus/skus.module'; // Remplace par ProductsModule
import { VendorStockModule } from './vendor-stock/vendor-stock.module';
import { ProductsModule } from './products/products.module';
import { PromotionsModule } from './promotions/promotions.module';
import { OrdersModule } from './orders/orders.module';
import { VisitsModule } from './visits/visits.module';
import { RoutePlansModule } from './route-plans/route-plans.module';
import { MerchandisingModule } from './merchandising/merchandising.module';
import { KpisModule } from './kpis/kpis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TerritoriesModule,
    OutletsModule,
    RoutesModule,
    // SKUsModule, // Temporairement desactive - remplace par ProductsModule
    VendorStockModule,
    ProductsModule,
    PromotionsModule,
    OrdersModule,
    VisitsModule,
    RoutePlansModule,
    MerchandisingModule,
    KpisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
