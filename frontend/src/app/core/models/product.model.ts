// src/app/core/models/product.model.ts
import {PriceHistoryEntry} from './price-history.model';

export interface TrackedProduct {
  id: string;
  userId: string;
  productUrl: string;
  productName: string;
  productImage?: string;
  currentPrice: number;
  currency: string;
  targetPrice?: number; // User's desired price point
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastCheckedAt?: Date;
  // Computed fields
  priceHistory?: PriceHistoryEntry[];
  priceChange?: {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface AddProductRequest {
  productUrl: string;
  targetPrice?: number;
}
