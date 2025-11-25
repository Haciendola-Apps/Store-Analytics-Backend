import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity()
export class LineItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    shopifyId: string;

    @Column()
    title: string;

    @Column('int')
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @ManyToOne(() => Order, (order) => order.lineItems, { onDelete: 'CASCADE' })
    order: Order;

    @ManyToOne(() => Product, { nullable: true })
    product: Product;
}
