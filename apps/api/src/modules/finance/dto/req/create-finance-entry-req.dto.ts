import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { FinanceEntryTypeEnum } from '@daylist/common';

export class CreateFinanceEntryReqDto {
  @IsUUID()
  categoryId!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsEnum(FinanceEntryTypeEnum)
  type!: FinanceEntryTypeEnum;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
