// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 4000);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true
  });

  // API prefix
  app.setGlobalPrefix('api');

  console.log(`🚀 Price Tracker API running on: http://localhost:${port}/api`);
  console.log(`📊 Environment: ${configService.get('NODE_ENV')}`);
  console.log(`🗄️  Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);

  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});
