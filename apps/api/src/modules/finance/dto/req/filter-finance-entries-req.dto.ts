import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FinanceEntryTypeEnum } from '@daylist/common';

export class FilterFinanceEntriesReqDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(FinanceEntryTypeEnum)
  type?: FinanceEntryTypeEnum;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
