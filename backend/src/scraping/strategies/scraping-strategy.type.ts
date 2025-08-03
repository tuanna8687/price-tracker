// Scraping Strategy Interface
import { ScrapedProduct } from '../scraping.service';

export interface IScrapingStrategy {
  parse(html: string, url: string): Promise<ScrapedProduct>;
}
