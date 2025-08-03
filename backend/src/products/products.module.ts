// backend/src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { UserProduct } from './entities/user-product.entity';
import { ScrapingModule } from '../scraping/scraping.module';
import { PriceHistoryModule } from '../price-history/price-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, UserProduct]),
    ScrapingModule,
    PriceHistoryModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {
}
