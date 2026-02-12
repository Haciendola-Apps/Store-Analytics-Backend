import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @Column({ default: 'CLP' })
    currency: string;

    @Column({ type: 'jsonb', default: {} })
    preferences: any; // For future settings like visible columns

    @UpdateDateColumn()
    updatedAt: Date;
}
