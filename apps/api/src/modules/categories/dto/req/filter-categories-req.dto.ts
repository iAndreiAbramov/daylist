import { IsEnum, IsOptional } from 'class-validator';
import { CategoryTypeEnum } from '@daylist/common';

export class FilterCategoriesReqDto {
  @IsOptional()
  @IsEnum(CategoryTypeEnum)
  type?: CategoryTypeEnum;
}
