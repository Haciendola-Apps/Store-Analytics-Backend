import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store } from './entities/store.entity';
import { Order } from '../analytics/entities/order.entity';
import { Product } from '../analytics/entities/product.entity';
import { ShopifyModule } from '../shopify/shopify.module';

import { LineItem } from '../analytics/entities/line-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Store, Order, Product, LineItem]),
        ShopifyModule,
    ],
    controllers: [StoreController],
    providers: [StoreService],
    exports: [StoreService],
})
export class StoreModule { }
