import { Expose } from 'class-transformer';
import { FinanceEntryTypeEnum } from '@daylist/common';

export class TopCategoryItemResDto {
  @Expose()
  categoryId!: string;

  @Expose()
  total!: number;

  @Expose()
  type!: FinanceEntryTypeEnum;
}
