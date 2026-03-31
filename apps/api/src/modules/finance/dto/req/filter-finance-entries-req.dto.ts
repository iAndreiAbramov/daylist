import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
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
  @Matches(/^\d{4}-\d{2}-\d{2}T/)
  from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}T/)
  to?: string;
}
