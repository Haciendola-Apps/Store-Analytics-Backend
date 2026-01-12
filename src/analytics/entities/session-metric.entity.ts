import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { Store } from '../../store/entities/store.entity';

@Entity()
@Index(['store', 'date'], { unique: true })
export class SessionMetric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @Column('int', { default: 0 })
    sessions: number;

    @Column('decimal', { precision: 10, scale: 4, default: 0, nullable: true })
    conversionRate: number;

    @ManyToOne(() => Store, (store) => store.sessionMetrics, { onDelete: 'CASCADE' })
    store: Store;
}
