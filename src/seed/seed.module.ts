import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
    imports: [
        UsersModule,
        AnalyticsModule
    ],
    providers: [SeedService],
})
export class SeedModule { }
