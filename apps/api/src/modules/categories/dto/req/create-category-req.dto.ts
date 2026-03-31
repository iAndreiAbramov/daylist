import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategoryTypeEnum } from '@daylist/common';

export class CreateCategoryReqDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEnum(CategoryTypeEnum)
  type!: CategoryTypeEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
