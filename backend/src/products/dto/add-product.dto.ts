// backend/src/products/dto/add-product.dto.ts
import { IsUrl, IsOptional, IsNumber, Min } from 'class-validator';

export class AddProductDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;
}
