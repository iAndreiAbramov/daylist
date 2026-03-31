import { Expose } from 'class-transformer';
import { FinanceEntryTypeEnum } from '@daylist/common';
import type { IFinanceEntry } from '@daylist/common/types/entities';

export class FinanceEntryResDto implements IFinanceEntry {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  categoryId!: string;

  @Expose()
  amount!: number;

  @Expose()
  type!: FinanceEntryTypeEnum;

  @Expose()
  description!: string | null;

  @Expose()
  date!: Date;

  @Expose()
  currency!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
