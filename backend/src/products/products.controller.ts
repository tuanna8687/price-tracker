// backend/src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AddProductDto } from './dto/add-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async addProduct(
    @CurrentUser() user: User,
    @Body() addProductDto: AddProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.addProductForUser(user.id, addProductDto);
  }

  @Get()
  async getUserProducts(@CurrentUser() user: User): Promise<ProductResponseDto[]> {
    return this.productsService.getUserProducts(user.id);
  }

  @Get(':id')
  async getProduct(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) productId: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.getProductById(productId, user.id);
  }

  @Put(':id/refresh')
  async refreshPrice(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) productId: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.refreshProductPrice(productId, user.id);
  }

  @Put(':id/target-price')
  async updateTargetPrice(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body('targetPrice') targetPrice: number,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateTargetPrice(productId, user.id, targetPrice);
  }

  @Delete(':id')
  async removeProduct(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) productId: string,
  ): Promise<{ message: string }> {
    await this.productsService.removeProductFromUser(productId, user.id);
    return { message: 'Product removed successfully' };
  }
}
