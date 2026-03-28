import { IBase } from './base';
import { FinanceEntryTypeEnum } from '../../enums/finance-entry-type.enum';

export type { FinanceEntryTypeEnum };

export interface IFinanceEntry extends IBase {
  userId: string;
  categoryId: string;
  amount: number;
  type: FinanceEntryTypeEnum;
  description: string | null;
  date: Date;
  currency: string;
}
