// backend/src/price-history/price-history.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistory } from './entities/price-history.entity';

export interface AddPriceRecordDto {
  productId: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  isAvailable?: boolean;
}

@Injectable()
export class PriceHistoryService {
  constructor(
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>
  ) {}

  async addPriceRecord(data: AddPriceRecordDto): Promise<PriceHistory> {
    const discountPercentage = data.originalPrice && data.price
      ? ((data.originalPrice - data.price) / data.originalPrice) * 100
      : undefined;

    const priceRecord = this.priceHistoryRepository.create({
      productId: data.productId,
      price: data.price,
      originalPrice: data.originalPrice,
      discountPercentage,
      currency: data.currency || 'VND',
      isAvailable: data.isAvailable ?? true
    });

    return this.priceHistoryRepository.save(priceRecord);
  }

  async getLatestPrice(productId: string): Promise<PriceHistory | null> {
    return this.priceHistoryRepository.findOne({
      where: { productId },
      order: { recordedAt: 'DESC' }
    });
  }

  async getPriceHistory(
    productId: string,
    limit: number = 100
  ): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.find({
      where: { productId },
      order: { recordedAt: 'DESC' },
      take: limit
    });
  }

  async getPriceStatistics(productId: string) {
    const prices = await this.priceHistoryRepository.find({
      where: { productId },
      order: { recordedAt: 'ASC' }
    });

    if (prices.length === 0) {
      return null;
    }

    const priceValues = prices.map(p => p.price);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const avgPrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const currentPrice = prices[prices.length - 1].price;
    const firstPrice = prices[0].price;

    return {
      currentPrice,
      minPrice,
      maxPrice,
      avgPrice: Math.round(avgPrice),
      totalRecords: prices.length,
      priceChangeFromStart: currentPrice - firstPrice,
      priceChangePercentFromStart: ((currentPrice - firstPrice) / firstPrice) * 100,
      lastUpdated: prices[prices.length - 1].recordedAt
    };
  }
}
