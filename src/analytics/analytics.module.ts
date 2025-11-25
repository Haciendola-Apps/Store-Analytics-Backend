import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Order } from './entities/order.entity';
import { Product } from './entities/product.entity';

import { LineItem } from './entities/line-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Product, LineItem])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService]
})
export class AnalyticsModule { }
