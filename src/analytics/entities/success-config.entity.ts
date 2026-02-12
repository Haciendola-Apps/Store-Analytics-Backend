import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SuccessConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ['fixed_amt', 'pct_amt'],
        unique: true
    })
    type: 'fixed_amt' | 'pct_amt';

    @Column('decimal', { precision: 20, scale: 2 })
    lowThreshold: number;

    @Column('decimal', { precision: 20, scale: 2 })
    mediumThreshold: number;

    @Column('decimal', { precision: 20, scale: 2 })
    highThreshold: number;

    @Column({ default: true })
    isActive: boolean;

    @UpdateDateColumn()
    updatedAt: Date;
}
