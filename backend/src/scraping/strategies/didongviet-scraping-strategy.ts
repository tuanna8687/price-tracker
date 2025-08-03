// Strategy for didongviet.vn
import { ScrapedProduct } from '../scraping.service';
import { IScrapingStrategy } from './scraping-strategy.type';
import * as cheerio from 'cheerio';

export class DiDongVietScrapingStrategy implements IScrapingStrategy {
  async parse(html: string, url: string): Promise<ScrapedProduct> {
    const $ = cheerio.load(html);

    return {
      title: this.extractTitle($),
      price: this.extractPrice($),
      originalPrice: this.extractOriginalPrice($),
      currency: 'VND',
      imageUrl: this.extractImage($, url),
      isAvailable: this.checkAvailability($),
      description: this.extractDescription($)
    };
  }

  private extractTitle($: cheerio.Root /*cheerio.CheerioAPI*/): string {
    const selectors = [
      'h1.product-title',
      '.product-name h1',
      'h1',
      '.product-title'
    ];

    for (const selector of selectors) {
      const title = $(selector).first().text().trim();
      if (title) return title;
    }

    return 'Unknown Product';
  }

  private extractPrice($: cheerio.Root /*cheerio.CheerioAPI*/): number {
    const selectors = [
      '.product-price .price',
      '.price-current',
      '.current-price',
      '.product-price-value'
    ];

    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price) return price;
    }

    return 0;
  }

  private extractOriginalPrice($: cheerio.Root /*cheerio.CheerioAPI*/): number | undefined {
    const selectors = [
      '.product-price .old-price',
      '.price-old',
      '.original-price'
    ];

    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price) return price;
    }

    return undefined;
  }

  private extractImage($: cheerio.Root /*cheerio.CheerioAPI*/, baseUrl: string): string {
    const selectors = [
      '.product-image img',
      '.product-gallery img',
      '.main-image img'
    ];

    for (const selector of selectors) {
      const imgSrc = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (imgSrc) {
        return this.resolveUrl(imgSrc, baseUrl);
      }
    }

    return '';
  }

  private checkAvailability($: cheerio.Root /*cheerio.CheerioAPI*/): boolean {
    const outOfStockIndicators = [
      'hết hàng',
      'out of stock',
      'ngừng kinh doanh',
      'temporarily unavailable'
    ];

    // @ts-ignore
    const pageText = $.text().toLowerCase();
    return !outOfStockIndicators.some(indicator => pageText.includes(indicator));
  }

  private extractDescription($: cheerio.Root /*cheerio.CheerioAPI*/): string {
    const selectors = [
      '.product-description',
      '.product-summary',
      '.product-info'
    ];

    for (const selector of selectors) {
      const desc = $(selector).first().text().trim();
      if (desc && desc.length > 20) {
        return desc.substring(0, 500) + (desc.length > 500 ? '...' : '');
      }
    }

    return '';
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;

    // Remove all non-digit characters except dots and commas
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');

    // Handle Vietnamese number format (1.000.000,00 or 1,000,000)
    let normalizedPrice = cleanPrice;

    if (normalizedPrice.includes(',') && normalizedPrice.includes('.')) {
      // Format: 1.000.000,00
      normalizedPrice = normalizedPrice.replace(/\./g, '').replace(',', '.');
    } else if (normalizedPrice.includes('.') && normalizedPrice.split('.').length > 2) {
      // Format: 1.000.000
      normalizedPrice = normalizedPrice.replace(/\./g, '');
    }

    const price = parseFloat(normalizedPrice);
    return isNaN(price) ? 0 : price;
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return new URL(baseUrl).origin + url;
    return baseUrl + '/' + url;
  }
}
