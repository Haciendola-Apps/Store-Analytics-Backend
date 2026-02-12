import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Order } from './entities/order.entity';
import { Product } from './entities/product.entity';
import { LineItem } from './entities/line-item.entity';
import { DailyMetric } from './entities/daily-metric.entity';
import { ProductMetric } from './entities/product-metric.entity';
import { SessionMetric } from './entities/session-metric.entity';
import { SuccessConfig } from './entities/success-config.entity';
import { Store } from '../store/entities/store.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(SessionMetric)
        private sessionMetricRepository: Repository<SessionMetric>,
        @InjectRepository(DailyMetric)
        private dailyMetricRepository: Repository<DailyMetric>,
        @InjectRepository(ProductMetric)
        private productMetricRepository: Repository<ProductMetric>,
        @InjectRepository(SuccessConfig)
        private successConfigRepository: Repository<SuccessConfig>,
        @InjectRepository(Store)
        private storeRepository: Repository<Store>,
    ) { }

    async getStoreAnalytics(
        storeId: string,
        startDate?: string,
        endDate?: string,
        comparisonPeriod?: 'previous_period' | 'last_month' | 'last_year',
        benchmarkPeriod: 'ref' | 'ref_1' | 'ref_2' | 'ref_3' = 'ref'
    ) {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        // 0. Get Store baseline
        const store = await this.storeRepository.findOne({ where: { id: storeId } });

        // Helper to calculate comparison range
        const getComparisonRange = () => {
            if (!comparisonPeriod || comparisonPeriod === 'none' as any) return null;

            const compStart = new Date(start);
            const compEnd = new Date(end);
            const duration = end.getTime() - start.getTime();

            if (comparisonPeriod === 'previous_period') {
                compStart.setTime(start.getTime() - duration - (24 * 60 * 60 * 1000));
                compEnd.setTime(start.getTime() - (24 * 60 * 60 * 1000));
            } else if (comparisonPeriod === 'last_month') {
                compStart.setMonth(start.getMonth() - 1);
                compEnd.setMonth(end.getMonth() - 1);
            } else if (comparisonPeriod === 'last_year') {
                compStart.setFullYear(start.getFullYear() - 1);
                compEnd.setFullYear(end.getFullYear() - 1);
            }

            return { start: compStart, end: compEnd };
        };

        // Helper to calculate benchmark range
        const getBenchmarkRange = () => {
            if (!store?.startDate || !store?.endDate) return null;

            const bStart = new Date(store.startDate);
            const bEnd = new Date(store.endDate);

            let offset = 0;
            if (benchmarkPeriod === 'ref_1') offset = 1;
            else if (benchmarkPeriod === 'ref_2') offset = 2;
            else if (benchmarkPeriod === 'ref_3') offset = 3;

            if (offset > 0) {
                bStart.setMonth(bStart.getMonth() - offset);
                bEnd.setMonth(bEnd.getMonth() - offset);
            }

            return { start: bStart, end: bEnd };
        };

        const comparisonRange = getComparisonRange();
        const benchmarkRange = getBenchmarkRange();

        // Helper for queries
        const getMetrics = async (s: Date, e: Date) => {
            const metrics = await this.dailyMetricRepository
                .createQueryBuilder('metric')
                .select('SUM(metric.totalRevenue)', 'totalRevenue')
                .addSelect('SUM(metric.totalOrders)', 'totalOrders')
                .addSelect('SUM(metric.sessions)', 'totalSessions')
                .addSelect('AVG(metric.conversionRate)', 'avgCR')
                .where('metric.storeId = :storeId', { storeId })
                .andWhere('metric.date BETWEEN :start AND :end', {
                    start: s.toISOString().split('T')[0],
                    end: e.toISOString().split('T')[0]
                })
                .getRawOne();

            const revenue = parseFloat(metrics.totalRevenue || '0');
            const orders = parseInt(metrics.totalOrders || '0');
            const aov = orders > 0 ? revenue / orders : 0;
            const sessions = parseInt(metrics.totalSessions || '0');
            // Use AVG of daily conversion rates to match Shopify's calculation
            // Shopify returns conversion_rate as decimal (0.007732 = 0.77%), so multiply by 100
            const cr = parseFloat(metrics.avgCR || '0') * 100;

            return { revenue, orders, aov, sessions, cr };
        };

        const currentMetrics = await getMetrics(start, end);

        let comparisonMetrics = null;
        if (comparisonRange) {
            comparisonMetrics = await getMetrics(comparisonRange.start, comparisonRange.end);
        }

        let benchmarkMetrics = null;
        if (benchmarkRange) {
            benchmarkMetrics = await getMetrics(benchmarkRange.start, benchmarkRange.end);
        }

        // Helper to calculate % change
        const calculateChange = (current: number, previous: number) => {
            if (!previous || previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // 2. Sales Over Time (Dynamic Grouping)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dbInterval = 'month';
        if (diffDays <= 14) dbInterval = 'day';
        else if (diffDays <= 60) dbInterval = 'week';

        const salesResults = await this.dailyMetricRepository
            .createQueryBuilder('metric')
            .select(`DATE_TRUNC('${dbInterval}', metric.date::date)`, 'date')
            .addSelect('SUM(metric.totalRevenue)', 'value')
            .where('metric.storeId = :storeId', { storeId })
            .andWhere('metric.date BETWEEN :start AND :end', {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            })
            .groupBy(`DATE_TRUNC('${dbInterval}', metric.date::date)`)
            .orderBy(`DATE_TRUNC('${dbInterval}', metric.date::date)`, 'ASC')
            .getRawMany();

        // Fill gaps
        const salesOverTime = [];
        const currentDate = new Date(start);
        currentDate.setHours(0, 0, 0, 0);
        if (dbInterval === 'week') {
            const day = currentDate.getDay();
            const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
            currentDate.setDate(diff);
        } else if (dbInterval === 'month') {
            currentDate.setDate(1);
        }

        const endDateObj = new Date(end);
        endDateObj.setHours(23, 59, 59, 999);

        while (currentDate <= endDateObj) {
            const match = salesResults.find(item => {
                const itemDate = new Date(item.date);
                return itemDate.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0];
            });

            let name = '';
            if (dbInterval === 'day') {
                name = currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else if (dbInterval === 'week') {
                const endOfWeek = new Date(currentDate);
                endOfWeek.setDate(currentDate.getDate() + 6);
                const startMonth = currentDate.toLocaleDateString('en-US', { month: 'short' });
                const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
                name = startMonth === endMonth ? `${currentDate.getDate()} - ${endOfWeek.getDate()} ${startMonth}` : `${currentDate.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth}`;
            } else {
                name = currentDate.toLocaleDateString('en-US', { month: 'short' });
            }

            salesOverTime.push({
                name,
                value: match ? parseFloat(match.value) : 0
            });

            if (dbInterval === 'day') currentDate.setDate(currentDate.getDate() + 1);
            else if (dbInterval === 'week') currentDate.setDate(currentDate.getDate() + 7);
            else currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // 3. Top Products (from ProductMetric)
        const topProducts = await this.productMetricRepository
            .createQueryBuilder('pm')
            .select('pm.productTitle', 'title')
            .addSelect('SUM(pm.netItemsSold)', 'totalQuantity')
            .addSelect('SUM(pm.totalSales)', 'totalSales')
            .where('pm.storeId = :storeId', { storeId })
            .andWhere('pm.totalSales > 0')
            .andWhere('pm.date BETWEEN :start AND :end', {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            })
            .groupBy('pm.productTitle')
            .orderBy('"totalSales"', 'DESC')
            .limit(5)
            .getRawMany();

        return {
            totalRevenue: currentMetrics.revenue,
            totalOrders: currentMetrics.orders,
            averageOrderValue: parseFloat(currentMetrics.aov.toFixed(2)),
            totalSessions: currentMetrics.sessions,
            conversionRate: parseFloat(currentMetrics.cr.toFixed(2)),
            comparison: comparisonMetrics ? {
                totalRevenueChange: calculateChange(currentMetrics.revenue, comparisonMetrics.revenue),
                totalOrdersChange: calculateChange(currentMetrics.orders, comparisonMetrics.orders),
                averageOrderValueChange: calculateChange(currentMetrics.aov, comparisonMetrics.aov),
                totalSessionsChange: calculateChange(currentMetrics.sessions, comparisonMetrics.sessions),
                conversionRateChange: calculateChange(currentMetrics.cr, comparisonMetrics.cr),
                values: {
                    totalRevenue: comparisonMetrics.revenue,
                    totalOrders: comparisonMetrics.orders,
                    averageOrderValue: comparisonMetrics.aov,
                    totalSessions: comparisonMetrics.sessions,
                    conversionRate: comparisonMetrics.cr
                },
                range: comparisonRange ? {
                    start: comparisonRange.start.toISOString().split('T')[0],
                    end: comparisonRange.end.toISOString().split('T')[0]
                } : null
            } : null,
            benchmark: benchmarkMetrics ? {
                totalRevenueChange: calculateChange(currentMetrics.revenue, benchmarkMetrics.revenue),
                totalOrdersChange: calculateChange(currentMetrics.orders, benchmarkMetrics.orders),
                averageOrderValueChange: calculateChange(currentMetrics.aov, benchmarkMetrics.aov),
                totalSessionsChange: calculateChange(currentMetrics.sessions, benchmarkMetrics.sessions),
                conversionRateChange: calculateChange(currentMetrics.cr, benchmarkMetrics.cr),
            } : null,
            salesOverTime: salesOverTime,
            topProducts: topProducts.map(p => ({
                id: p.title,
                title: p.title,
                totalSales: parseFloat(p.totalSales)
            }))
        };
    }

    async getSessionMetrics(storeId: string, startDate?: string, endDate?: string) {
        let query = this.sessionMetricRepository
            .createQueryBuilder('metric')
            .where('metric.storeId = :storeId', { storeId })
            .orderBy('metric.date', 'ASC');

        if (startDate && endDate) {
            query = query.andWhere('metric.date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });
        }

        const metrics = await query.getMany();

        return {
            sessions: metrics.map(m => ({
                date: m.date,
                sessions: m.sessions,
                conversionRate: m.conversionRate ? parseFloat(m.conversionRate.toString()) : null
            }))
        };
    }

    async getSuccessStatus(storeId: string) {
        const store = await this.storeRepository.findOne({ where: { id: storeId } });
        if (!store || !store.startDate) {
            return {
                status: 'error',
                message: 'Store or Start Date not found'
            };
        }

        // Calculate Reference Period (from startDate to today or endDate)
        const startDate = new Date(store.startDate);
        const today = new Date();
        const endDate = store.endDate && store.endDate < today ? new Date(store.endDate) : today;

        const durationInMs = endDate.getTime() - startDate.getTime();
        const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));

        // Prev Period is same duration before startDate
        const prevStart = new Date(startDate);
        prevStart.setDate(startDate.getDate() - durationInDays - 1);
        const prevEnd = new Date(startDate);
        prevEnd.setDate(startDate.getDate() - 1);

        // Get Metrics for both periods
        const getMetrics = async (s: Date, e: Date) => {
            const result = await this.dailyMetricRepository
                .createQueryBuilder('metric')
                .select('SUM(metric.totalRevenue)', 'totalRevenue')
                .where('metric.storeId = :storeId', { storeId })
                .andWhere('metric.date BETWEEN :start AND :end', {
                    start: s.toISOString().split('T')[0],
                    end: e.toISOString().split('T')[0]
                })
                .getRawOne();

            return parseFloat(result.totalRevenue || '0');
        };

        const currentRevenue = await getMetrics(startDate, endDate);
        const previousRevenue = await getMetrics(prevStart, prevEnd);

        const revenueIncrease = currentRevenue - previousRevenue;
        const percentageIncrease = previousRevenue > 0 
            ? (revenueIncrease / previousRevenue) * 100 
            : (currentRevenue > 0 ? 100 : 0);

        // Get Thresholds
        const configs = await this.successConfigRepository.find({ where: { isActive: true } });
        const fixedConfig = configs.find(c => c.type === 'fixed_amt');
        const pctConfig = configs.find(c => c.type === 'pct_amt');

        const calculateLevel = (value: number, config: SuccessConfig | undefined) => {
            if (!config) return 'ninguno';
            if (value >= config.highThreshold) return 'alto';
            if (value >= config.mediumThreshold) return 'medio';
            if (value >= config.lowThreshold) return 'leve';
            if (value < 0) return 'negativo';
            return 'ninguno';
        };

        return {
            storeName: store.name,
            durationInDays,
            periods: {
                reference: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0], revenue: currentRevenue },
                previous: { start: prevStart.toISOString().split('T')[0], end: prevEnd.toISOString().split('T')[0], revenue: previousRevenue }
            },
            metrics: {
                fixedIncrease: revenueIncrease,
                percentageIncrease: percentageIncrease
            },
            successLevels: {
                fixed: calculateLevel(revenueIncrease, fixedConfig),
                percentage: calculateLevel(percentageIncrease, pctConfig)
            },
            thresholdsUsed: {
                fixed: fixedConfig ? { low: fixedConfig.lowThreshold, medium: fixedConfig.mediumThreshold, high: fixedConfig.highThreshold } : null,
                percentage: pctConfig ? { low: pctConfig.lowThreshold, medium: pctConfig.mediumThreshold, high: pctConfig.highThreshold } : null
            }
        };
    }

    async getAllSuccessStatuses() {
        const stores = await this.storeRepository.find({
            where: { startDate: Not(IsNull()) }
        });

        const configs = await this.successConfigRepository.find({ where: { isActive: true } });
        const fixedConfig = configs.find(c => c.type === 'fixed_amt');
        const pctConfig = configs.find(c => c.type === 'pct_amt');

        const calculateLevel = (value: number, config: SuccessConfig | undefined) => {
            if (!config) return 'ninguno';
            if (value >= config.highThreshold) return 'alto';
            if (value >= config.mediumThreshold) return 'medio';
            if (value >= config.lowThreshold) return 'leve';
            if (value < 0) return 'negativo';
            return 'ninguno';
        };

        const results = [];

        for (const store of stores) {
            const startDate = new Date(store.startDate);
            const today = new Date();
            const endDate = store.endDate && store.endDate < today ? new Date(store.endDate) : today;

            const durationInMs = endDate.getTime() - startDate.getTime();
            const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));

            const prevStart = new Date(startDate);
            prevStart.setDate(startDate.getDate() - durationInDays - 1);
            const prevEnd = new Date(startDate);
            prevEnd.setDate(startDate.getDate() - 1);

            const metrics = await this.dailyMetricRepository
                .createQueryBuilder('metric')
                .select("SUM(CASE WHEN metric.date BETWEEN :start AND :end THEN metric.totalRevenue ELSE 0 END)", 'currentRevenue')
                .addSelect("SUM(CASE WHEN metric.date BETWEEN :pStart AND :pEnd THEN metric.totalRevenue ELSE 0 END)", 'prevRevenue')
                .where('metric.storeId = :storeId', { storeId: store.id })
                .setParameters({
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0],
                    pStart: prevStart.toISOString().split('T')[0],
                    pEnd: prevEnd.toISOString().split('T')[0]
                })
                .getRawOne();

            const currentRevenue = parseFloat(metrics.currentRevenue || '0');
            const prevRevenue = parseFloat(metrics.prevRevenue || '0');

            const revenueIncrease = currentRevenue - prevRevenue;
            const percentageIncrease = prevRevenue > 0 
                ? (revenueIncrease / prevRevenue) * 100 
                : (currentRevenue > 0 ? 100 : 0);

            results.push({
                storeId: store.id,
                fixedLevel: calculateLevel(revenueIncrease, fixedConfig),
                percentageLevel: calculateLevel(percentageIncrease, pctConfig),
                metrics: {
                    fixedIncrease: revenueIncrease,
                    percentageIncrease: percentageIncrease,
                    currentRevenue,
                    prevRevenue,
                    durationInDays
                }
            });
        }

        return results;
    }

    async seedSuccessConfigs() {
        const count = await this.successConfigRepository.count();
        if (count === 0) {
            console.log('Seeding default Success Configs...');
            
            const configs = [
                {
                    type: 'fixed_amt' as const,
                    lowThreshold: 5000000,
                    mediumThreshold: 10000000,
                    highThreshold: 15000000,
                    isActive: true
                },
                {
                    type: 'pct_amt' as const,
                    lowThreshold: 5,
                    mediumThreshold: 10,
                    highThreshold: 15,
                    isActive: true
                }
            ];

            await this.successConfigRepository.save(configs);
            console.log('Success Configs seeded successfully.');
        }
    }
}
