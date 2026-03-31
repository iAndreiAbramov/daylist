import { Expose } from 'class-transformer';
import { FinanceEntryTypeEnum } from '@daylist/common';

export class LargestTransactionResDto {
  @Expose()
  id!: string;

  @Expose()
  amount!: number;

  @Expose()
  type!: FinanceEntryTypeEnum;

  @Expose()
  categoryId!: string;

  @Expose()
  date!: Date;

  @Expose()
  description!: string | null;

  @Expose()
  currency!: string;
}
