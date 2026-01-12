import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get(':storeId')
    getAnalytics(
        @Param('storeId') storeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.analyticsService.getStoreAnalytics(storeId, startDate, endDate);
    }

    @Get(':storeId/sessions')
    getSessionMetrics(
        @Param('storeId') storeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.analyticsService.getSessionMetrics(storeId, startDate, endDate);
    }
}
