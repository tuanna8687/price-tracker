// backend/src/products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { UserProduct } from './user-product.entity';
import { PriceHistory } from '../../price-history/entities/price-history.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 1000, unique: true })
  @Index()
  url: string;

  @Column({ length: 500, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 1000, nullable: true })
  imageUrl: string;

  @Column({ length: 255 })
  @Index()
  domain: string;

  @Column({ type: 'jsonb', nullable: true })
  selectorConfig: {
    priceSelector?: string;
    titleSelector?: string;
    imageSelector?: string;
    currencySelector?: string;
    availabilitySelector?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserProduct, userProduct => userProduct.product)
  userProducts: UserProduct[];

  @OneToMany(() => PriceHistory, priceHistory => priceHistory.product)
  priceHistory: PriceHistory[];

  // Virtual properties
  get currentPrice(): number | null {
    if (this.priceHistory && this.priceHistory.length > 0) {
      return this.priceHistory[0].price;
    }
    return null;
  }

  get priceChange(): number | null {
    if (this.priceHistory && this.priceHistory.length >= 2) {
      const current = this.priceHistory[0].price;
      const previous = this.priceHistory[1].price;
      return current - previous;
    }
    return null;
  }
}
