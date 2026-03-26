import { IBase } from './base';

export type FinanceEntryType = 'income' | 'expense';

export interface IFinanceEntry extends IBase {
  userId: string;
  categoryId: string;
  amount: number;
  type: FinanceEntryType;
  description: string | null;
  date: Date;
  currency: string;
}
