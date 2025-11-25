import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Store } from '../../store/entities/store.entity';

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    shopifyId: string;

    @Column()
    title: string;

    @Column('int', { default: 0 })
    totalSales: number;

    @ManyToOne(() => Store, (store) => store.products)
    store: Store;
}
