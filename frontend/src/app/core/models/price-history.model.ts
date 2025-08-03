// src/app/core/models/price-history.model.ts
export interface PriceHistoryEntry {
  id: string;
  trackedProductId: string;
  price: number;
  recordedAt: Date;
  priceChangeType: 'increase' | 'decrease' | 'stable';
}

export interface PriceAlert {
  id: string;
  userId: string;
  trackedProductId: string;
  alertType: 'price_drop' | 'target_reached' | 'price_increase';
  targetPrice: number;
  isActive: boolean;
  createdAt: Date;
}
