// backend/src/price-history/entities/price-history.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('price_history')
@Index(['productId', 'recordedAt'])
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ length: 3, default: 'VND' })
  currency: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  @Index()
  recordedAt: Date;

  // Relations
  @ManyToOne(() => Product, product => product.priceHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Virtual properties
  get discountAmount(): number | null {
    if (this.originalPrice && this.price) {
      return this.originalPrice - this.price;
    }
    return null;
  }

  get formattedPrice(): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: this.currency
    }).format(this.price);
  }
}
