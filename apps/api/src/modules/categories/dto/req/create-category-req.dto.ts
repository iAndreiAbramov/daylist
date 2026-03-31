import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CategoryTypeEnum } from '@daylist/common';

export class CreateCategoryReqDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(CategoryTypeEnum)
  type!: CategoryTypeEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
