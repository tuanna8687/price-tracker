// backend/src/price-history/price-history.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistoryService } from './price-history.service';
import { PriceHistory } from './entities/price-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory])],
  providers: [PriceHistoryService],
  exports: [PriceHistoryService]
})
export class PriceHistoryModule {
}
