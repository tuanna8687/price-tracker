// Generic strategy for unknown domains
import { ScrapedProduct } from '../scraping.service';
import { IScrapingStrategy } from './scraping-strategy.type';
import * as cheerio from 'cheerio';

export class GenericScrapingStrategy implements IScrapingStrategy {
  async parse(html: string, url: string): Promise<ScrapedProduct> {
    const $ = cheerio.load(html);

    return {
      title: this.extractGenericTitle($),
      price: this.extractGenericPrice($),
      currency: 'VND',
      imageUrl: this.extractGenericImage($, url),
      isAvailable: true,
      description: '',
    };
  }

  private extractGenericTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      'h1',
      '.product-title',
      '.product-name',
      'title'
    ];

    for (const selector of selectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5) return title;
    }

    return 'Unknown Product';
  }

  private extractGenericPrice($: cheerio.CheerioAPI): number {
    const priceSelectors = [
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="amount"]'
    ];

    for (const selector of priceSelectors) {
      const elements = $(selector);
      elements.each((index, element) => {
        const text = $(element).text();
        const price = this.parsePrice(text);
        // if (price > 1000) return price; // Reasonable price threshold
        // return 0;
      });
    }

    return 0;
  }

  private extractGenericImage($: cheerio.CheerioAPI, baseUrl: string): string {
    const selectors = [
      '.product-image img',
      '.main-image img',
      'img[alt*="product"]',
      'img[src*="product"]'
    ];

    for (const selector of selectors) {
      const imgSrc = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (imgSrc) {
        return this.resolveUrl(imgSrc, baseUrl);
      }
    }

    return '';
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice.replace(/,/g, ''));
    return isNaN(price) ? 0 : price;
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return new URL(baseUrl).origin + url;
    return baseUrl + '/' + url;
  }
}
