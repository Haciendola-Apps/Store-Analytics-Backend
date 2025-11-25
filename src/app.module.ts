import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './store/store.module';
import { ShopifyModule } from './shopify/shopify.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { Store } from './store/entities/store.entity';
import { Order } from './analytics/entities/order.entity';
import { Product } from './analytics/entities/product.entity';
import { DailyMetric } from './analytics/entities/daily-metric.entity';
import { LineItem } from './analytics/entities/line-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432') || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres_password',
      database: process.env.DB_NAME || 'store_analytics',
      entities: [Store, Order, Product, DailyMetric, LineItem],
      synchronize: true, // Auto-create tables (Dev only)
    }),
    StoreModule,
    ShopifyModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
