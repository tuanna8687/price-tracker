// backend/src/scraping/scraping.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { IScrapingStrategy } from './strategies/scraping-strategy.type';
import { DiDongVietScrapingStrategy } from './strategies/didongviet-scraping-strategy';
import { TheGioiDiDongScrapingStrategy } from './strategies/thegioididong-scraping-strategy';
import { GenericScrapingStrategy } from './strategies/generic-scraping-strategy';
import { CellphonesScrapingStrategy } from './strategies/cellphones-scraping-strategy';
import { FptShopScrapingStrategy } from './strategies/fptshop-scraping-strategy';

export interface ScrapedProduct {
  title?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  description?: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedProduct;
  error?: string;
}

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private browser: puppeteer.Browser | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Initialize browser on service start
    await this.initBrowser();
  }

  async onModuleDestroy() {
    // Clean up browser on service destroy
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      this.logger.log('Browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
    }
  }

  async scrapeProduct(url: string): Promise<ScrapeResult> {
    try {
      const domain = this.extractDomain(url);
      const strategy = this.getScrapingStrategy(domain);

      this.logger.log(`Scraping product from: ${url}`);

      const page = await this.browser!.newPage();

      // Set user agent to avoid blocking
      await page.setUserAgent(
        this.configService.get('SCRAPING_USER_AGENT',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
      );

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: this.configService.get('SCRAPING_TIMEOUT', 30000)
      });

      // Get page content
      const content = await page.content();
      await page.close();

      // Parse content based on domain strategy
      const result = await strategy.parse(content, url);

      this.logger.log(`Successfully scraped product: ${result.title}`);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error(`Failed to scrape ${url}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private getScrapingStrategy(domain: string): IScrapingStrategy {
    switch (domain) {
      case 'didongviet.vn':
        return new DiDongVietScrapingStrategy();
      case 'thegioididong.com':
        return new TheGioiDiDongScrapingStrategy();
      case 'cellphones.com.vn':
        return new CellphonesScrapingStrategy();
      case 'fptshop.com.vn':
        return new FptShopScrapingStrategy();
      default:
        return new GenericScrapingStrategy();
    }
  }
}
