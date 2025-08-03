import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ScrapingModule } from './scraping/scraping.module';
import { PriceHistoryModule } from './price-history/price-history.module';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { UserProduct } from './products/entities/user-product.entity';
import { PriceHistory } from './price-history/entities/price-history.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      envFilePath: '.env.development',
      isGlobal: true
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Product, UserProduct, PriceHistory],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development'
      }),
      inject: [ConfigService]
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100 // 100 requests per minute
      }
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    ProductsModule,
    ScrapingModule,
    PriceHistoryModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
}
