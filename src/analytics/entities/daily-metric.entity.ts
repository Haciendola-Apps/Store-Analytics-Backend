import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Store } from '../../store/entities/store.entity';

@Entity()
export class DailyMetric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    totalRevenue: number;

    @Column('int', { default: 0 })
    totalOrders: number;

    @Column('int', { default: 0 })
    visits: number;

    @ManyToOne(() => Store, (store) => store.dailyMetrics)
    store: Store;
}
