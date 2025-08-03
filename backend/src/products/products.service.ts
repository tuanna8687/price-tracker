// backend/src/products/products.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { UserProduct } from './entities/user-product.entity';
import { PriceHistory } from '../price-history/entities/price-history.entity';
import { ScrapingService } from '../scraping/scraping.service';
import { PriceHistoryService } from '../price-history/price-history.service';
import { AddProductDto } from './dto/add-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(UserProduct)
    private userProductRepository: Repository<UserProduct>,
    private scrapingService: ScrapingService,
    private priceHistoryService: PriceHistoryService
  ) {}

  async addProductForUser(
    userId: string,
    addProductDto: AddProductDto
  ): Promise<ProductResponseDto> {
    const { url, targetPrice } = addProductDto;

    // Check if user already tracks this product
    const existingProduct = await this.productRepository.findOne({
      where: { url },
      relations: ['userProducts']
    });

    if (existingProduct) {
      const existingUserProduct = await this.userProductRepository.findOne({
        where: { userId, productId: existingProduct.id }
      });

      if (existingUserProduct) {
        throw new ConflictException('You are already tracking this product');
      }

      // Add user to existing product
      await this.userProductRepository.save({
        userId,
        productId: existingProduct.id,
        targetPrice
      });

      return this.formatProductResponse(existingProduct, targetPrice);
    }

    // Scrape product info
    const scrapeResult = await this.scrapingService.scrapeProduct(url);
    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape product: ${scrapeResult.error}`);
    }

    const { data: scrapedData } = scrapeResult;

    // Create new product
    const domain = this.extractDomain(url);
    const product = await this.productRepository.save({
      url,
      title: scrapedData!.title || 'Unknown Product',
      description: scrapedData!.description,
      imageUrl: scrapedData!.imageUrl,
      domain,
      selectorConfig: {} // Will be populated later for custom selectors
    });

    // Add user product relationship
    await this.userProductRepository.save({
      userId,
      productId: product.id,
      targetPrice
    });

    // Save initial price
    if (scrapedData!.price && scrapedData!.price > 0) {
      await this.priceHistoryService.addPriceRecord({
        productId: product.id,
        price: scrapedData!.price,
        originalPrice: scrapedData!.originalPrice,
        currency: scrapedData!.currency || 'VND',
        isAvailable: scrapedData!.isAvailable ?? true
      });
    }

    return this.formatProductResponse(product, targetPrice);
  }

  async getUserProducts(userId: string): Promise<ProductResponseDto[]> {
    const userProducts = await this.userProductRepository.find({
      where: { userId, isActive: true },
      relations: ['product', 'product.priceHistory'],
      order: { createdAt: 'DESC' }
    });

    return userProducts.map(userProduct => {
      const product = userProduct.product;
      // Sort price history by date descending (latest first)
      if (product.priceHistory) {
        product.priceHistory.sort((a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
      }

      return this.formatProductResponse(product, userProduct.targetPrice);
    });
  }

  async getProductById(productId: string, userId: string): Promise<ProductResponseDto> {
    const userProduct = await this.userProductRepository.findOne({
      where: { productId, userId },
      relations: ['product', 'product.priceHistory']
    });

    if (!userProduct) {
      throw new NotFoundException('Product not found');
    }

    const product = userProduct.product;
    if (product.priceHistory) {
      product.priceHistory.sort((a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
    }

    return this.formatProductResponse(product, userProduct.targetPrice);
  }

  async refreshProductPrice(productId: string, userId: string): Promise<ProductResponseDto> {
    const userProduct = await this.userProductRepository.findOne({
      where: { productId, userId },
      relations: ['product']
    });

    if (!userProduct) {
      throw new NotFoundException('Product not found');
    }

    const product = userProduct.product;

    // Scrape latest price
    const scrapeResult = await this.scrapingService.scrapeProduct(product.url);
    if (!scrapeResult.success) {
      throw new Error(`Failed to refresh price: ${scrapeResult.error}`);
    }

    const { data: scrapedData } = scrapeResult;

    // Update product info if needed
    if (scrapedData!.title && scrapedData!.title !== product.title) {
      product.title = scrapedData!.title;
      product.description = scrapedData!.description ?? '';
      product.imageUrl = scrapedData!.imageUrl ?? '';
      await this.productRepository.save(product);
    }

    // Add new price record if price changed
    if (scrapedData!.price && scrapedData!.price > 0) {
      const latestPrice = await this.priceHistoryService.getLatestPrice(productId);

      if (!latestPrice || latestPrice.price !== scrapedData!.price) {
        await this.priceHistoryService.addPriceRecord({
          productId,
          price: scrapedData!.price,
          originalPrice: scrapedData!.originalPrice,
          currency: scrapedData!.currency || 'VND',
          isAvailable: scrapedData!.isAvailable ?? true
        });
      }
    }

    // Return updated product with fresh price history
    return this.getProductById(productId, userId);
  }

  async removeProductFromUser(productId: string, userId: string): Promise<void> {
    const userProduct = await this.userProductRepository.findOne({
      where: { productId, userId }
    });

    if (!userProduct) {
      throw new NotFoundException('Product not found');
    }

    await this.userProductRepository.remove(userProduct);
  }

  async updateTargetPrice(
    productId: string,
    userId: string,
    targetPrice: number
  ): Promise<ProductResponseDto> {
    const userProduct = await this.userProductRepository.findOne({
      where: { productId, userId }
    });

    if (!userProduct) {
      throw new NotFoundException('Product not found');
    }

    userProduct.targetPrice = targetPrice;
    await this.userProductRepository.save(userProduct);

    return this.getProductById(productId, userId);
  }

  private formatProductResponse(product: Product, targetPrice?: number): ProductResponseDto {
    const currentPrice = product.priceHistory?.[0]?.price;
    const previousPrice = product.priceHistory?.[1]?.price;
    const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : undefined;

    return {
      id: product.id,
      url: product.url,
      title: product.title,
      description: product.description,
      imageUrl: product.imageUrl,
      domain: product.domain,
      currentPrice,
      targetPrice,
      priceChange,
      isAvailable: product.priceHistory?.[0]?.isAvailable ?? true,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      priceHistory: product.priceHistory?.slice(0, 30).map(ph => ({
        price: ph.price,
        recordedAt: ph.recordedAt
      }))
    };
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
}
