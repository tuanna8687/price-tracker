// backend/src/products/dto/product-response.dto.ts
export class ProductResponseDto {
  id: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  domain: string;
  currentPrice?: number;
  targetPrice?: number;
  priceChange?: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  priceHistory?: {
    price: number;
    recordedAt: Date;
  }[];
}
