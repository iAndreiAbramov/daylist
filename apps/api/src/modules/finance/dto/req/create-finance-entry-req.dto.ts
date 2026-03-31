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
  Matches,
  MaxLength,
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
  @MaxLength(255)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}T/)
  date?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
