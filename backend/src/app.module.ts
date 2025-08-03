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
    // ConfigModule - must be first and global
    ConfigModule.forRoot({
      envFilePath: ['.env.development'],
      isGlobal: true
    }),

    // Throttler for rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: 10, // 10 requests per minute
          },
        ],
      }),
    }),

    // Database TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'postgres'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USER', 'devuser'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME', 'pricetracker_dev'),
          // entities: [__dirname + '/**/*.entity{.ts,.js}'],
          entities: [User, Product, UserProduct, PriceHistory],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
    }),

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
